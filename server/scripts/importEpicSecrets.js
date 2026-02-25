/**
 * Import Epic client secrets from managedkeysfhir.txt into the HealthSystem collection.
 * Parses the text file, matches each entry to a HealthSystem by name,
 * encrypts the secret, and stores it.
 *
 * Supports two input formats:
 *   1. Text file (managedkeysfhir.txt):
 *      "OrgName non prod <secret>"
 *      "OrgName prod <secret>"
 *      "OrgName production <secret>"
 *
 *   2. JSON file (from browser automation script):
 *      [{ "orgName": "...", "orgId": "...", "type": "prod|non prod", "secret": "..." }]
 *
 * Usage:
 *   node server/scripts/importEpicSecrets.js                    # dry run (default)
 *   node server/scripts/importEpicSecrets.js --commit           # actually write to DB
 *   node server/scripts/importEpicSecrets.js --file path.json   # use JSON file instead
 *   node server/scripts/importEpicSecrets.js --commit --file path.json
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const HealthSystem = require('../models/HealthSystem');

// Parse command-line args
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const fileArgIdx = args.indexOf('--file');
const INPUT_FILE = fileArgIdx !== -1 && args[fileArgIdx + 1]
    ? path.resolve(args[fileArgIdx + 1])
    : path.resolve(__dirname, '../services/managedkeysfhir.txt');

/**
 * Parse a single line from the text file.
 * Format: "OrgName non prod <secret>" or "OrgName prod <secret>" or "OrgName production <secret>"
 * Returns { orgName, type, secret } or null if unparseable.
 */
function parseLine(line) {
    line = line.trim();
    if (!line) return null;

    // Match: everything up to " non prod ", " production ", or " prod " followed by the secret
    const match = line.match(/^(.+?)\s+(non prod|production|prod)\s+(\S+)$/);
    if (!match) return null;

    let [, orgName, type, secret] = match;

    // Normalize type
    if (type === 'production') type = 'prod';

    return { orgName: orgName.trim(), type, secret };
}

/**
 * Parse the input file (text or JSON).
 * Returns an array of { orgName, orgId?, type, secret }.
 */
function parseInputFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json') {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
            throw new Error('JSON file must contain an array');
        }
        return data.map(entry => ({
            orgName: entry.orgName,
            orgId: entry.orgId || null,
            type: entry.type === 'production' ? 'prod' : entry.type,
            secret: entry.secret
        }));
    }

    // Parse as text file
    const lines = content.split('\n');
    const entries = [];
    for (let i = 0; i < lines.length; i++) {
        const parsed = parseLine(lines[i]);
        if (parsed) {
            entries.push(parsed);
        } else if (lines[i].trim()) {
            console.warn(`  Line ${i + 1}: could not parse — "${lines[i].trim().substring(0, 60)}..."`);
        }
    }
    return entries;
}

/**
 * Normalize a name for fuzzy matching.
 * Removes punctuation, extra spaces, and lowercases.
 */
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function importSecrets() {
    console.log('=== Epic Secret Import ===');
    console.log(`Mode: ${COMMIT ? 'COMMIT (writing to DB)' : 'DRY RUN (no changes)'}`);
    console.log(`Input: ${INPUT_FILE}`);
    console.log('');

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`File not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    // Parse input
    const entries = parseInputFile(INPUT_FILE);
    console.log(`Parsed ${entries.length} secret entries from file\n`);

    if (entries.length === 0) {
        console.log('No entries to import.');
        process.exit(0);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Load all health systems for matching
    const allSystems = await HealthSystem.find({}).lean();
    console.log(`Found ${allSystems.length} health systems in database\n`);

    // Build lookup maps
    const byExactName = new Map();
    const byNormalizedName = new Map();
    const byEpicOrgId = new Map();

    for (const hs of allSystems) {
        byExactName.set(hs.name, hs);
        byNormalizedName.set(normalizeName(hs.name), hs);
        if (hs.epicOrgId) {
            byEpicOrgId.set(hs.epicOrgId, hs);
        }
    }

    // Process each entry
    let matched = 0;
    let unmatched = 0;
    let updated = 0;
    let skippedExisting = 0;
    const unmatchedEntries = [];

    for (const entry of entries) {
        // Try to match: exact name → normalized name → epicOrgId
        let hs = byExactName.get(entry.orgName);
        if (!hs) {
            hs = byNormalizedName.get(normalizeName(entry.orgName));
        }
        if (!hs && entry.orgId) {
            hs = byEpicOrgId.get(entry.orgId);
        }

        if (!hs) {
            unmatched++;
            unmatchedEntries.push(entry);
            console.log(`  ✗ NO MATCH: "${entry.orgName}" (${entry.type})`);
            continue;
        }

        matched++;

        // Check if secret already exists
        const isProd = entry.type === 'prod';
        const existingField = isProd ? hs.clientSecret : hs.clientSecretNonProd;

        if (existingField) {
            skippedExisting++;
            console.log(`  ⊘ SKIP (already has ${entry.type} secret): ${hs.name}`);
            continue;
        }

        if (COMMIT) {
            // Load the full Mongoose document for encryption methods
            const doc = await HealthSystem.findById(hs._id);
            if (isProd) {
                doc.setClientSecret(entry.secret);
                if (!doc.activatedAt) doc.activatedAt = new Date();
            } else {
                doc.setClientSecretNonProd(entry.secret);
            }

            // Store epicOrgId if we have it and it's not set yet
            if (entry.orgId && !doc.epicOrgId) {
                doc.epicOrgId = entry.orgId;
            }

            await doc.save();
            updated++;
            console.log(`  ✓ SAVED ${entry.type} secret: ${hs.name}`);
        } else {
            console.log(`  → WOULD SAVE ${entry.type} secret: ${hs.name} (matched from "${entry.orgName}")`);
        }
    }

    // Summary
    console.log('\n====================================');
    console.log('            SUMMARY');
    console.log('====================================');
    console.log(`Total entries in file:     ${entries.length}`);
    console.log(`Matched to health system:  ${matched}`);
    console.log(`No match found:            ${unmatched}`);
    console.log(`Skipped (already has key): ${skippedExisting}`);
    if (COMMIT) {
        console.log(`Secrets written to DB:     ${updated}`);
    } else {
        console.log(`Would write to DB:         ${matched - skippedExisting}`);
        console.log('\nRun with --commit to actually write to the database.');
    }

    if (unmatchedEntries.length > 0) {
        console.log('\n--- UNMATCHED ENTRIES ---');
        console.log('These org names did not match any HealthSystem in the database:');
        const uniqueNames = [...new Set(unmatchedEntries.map(e => e.orgName))];
        uniqueNames.forEach(name => console.log(`  - ${name}`));
        console.log('\nPossible fixes:');
        console.log('  1. Check for name differences between Epic portal and epicEndpoints.json');
        console.log('  2. Add missing orgs to epicEndpoints.json and re-run seedHealthSystems.js');
        console.log('  3. Manually update via the admin PUT /api/health-systems/:id/secret endpoint');
    }

    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(0);
}

importSecrets().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
});
