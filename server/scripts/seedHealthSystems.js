/**
 * Seed health systems into the database from Epic's official endpoint list.
 * Reads epicEndpoints.json, converts DSTU2 URLs to R4, derives OAuth endpoints.
 * Idempotent — safe to run multiple times.
 *
 * Usage: node server/scripts/seedHealthSystems.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const HealthSystem = require('../models/HealthSystem');
const epicEndpoints = require('./epicEndpoints.json');

/**
 * Manual overrides for health systems where the auto-derived OAuth endpoints
 * are known to differ from the FHIR base URL host (verified via .well-known/smart-configuration).
 * Key = slug
 */
const manualOverrides = {
    'baylor-scott-and-white-health': {
        fhirBaseUrl: 'https://rxproxy.sw.org/FHIR-PRD/BSW/api/FHIR/R4',
        authorizeUrl: 'https://epicproxy.bswhealth.org/FHIR-PRD/oauth2/authorize',
        tokenUrl: 'https://epicproxy.bswhealth.org/FHIR-PRD/oauth2/token',
        city: 'Dallas',
        state: 'TX'
    },
    'texas-health-resources': {
        fhirBaseUrl: 'https://epproxy.texashealth.org/FHIR/api/FHIR/R4',
        authorizeUrl: 'https://epproxy.texashealth.org/FHIR/oauth2/authorize',
        tokenUrl: 'https://epproxy.texashealth.org/FHIR/oauth2/token',
        city: 'Arlington',
        state: 'TX'
    },
    'cook-childrens-health-care-system': {
        fhirBaseUrl: 'https://cookicfg.cookchildrens.org/CookFHIR/api/FHIR/R4',
        authorizeUrl: 'https://cookicfg.cookchildrens.org/CookFHIR/oauth2/authorize',
        tokenUrl: 'https://cookicfg.cookchildrens.org/CookFHIR/oauth2/token',
        city: 'Fort Worth',
        state: 'TX'
    }
};

/**
 * Convert organization name to URL-friendly slug.
 * e.g. "Baylor Scott & White" -> "baylor-scott-white"
 */
function toSlug(name) {
    return name
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Convert DSTU2 FHIR URL to R4.
 * e.g. ".../api/FHIR/DSTU2/" -> ".../api/FHIR/R4"
 */
function toR4Url(dstu2Url) {
    return dstu2Url.replace(/\/api\/FHIR\/DSTU2\/?$/, '/api/FHIR/R4');
}

/**
 * Derive OAuth authorize and token URLs from a FHIR base URL.
 * Takes the path prefix before /api/FHIR/ and appends /oauth2/authorize and /oauth2/token.
 * e.g. "https://host.com/FHIR/api/FHIR/R4" -> "https://host.com/FHIR/oauth2/authorize"
 */
function deriveOAuthUrls(fhirBaseUrl) {
    const idx = fhirBaseUrl.indexOf('/api/FHIR/');
    if (idx === -1) {
        return { authorizeUrl: '', tokenUrl: '' };
    }
    const basePath = fhirBaseUrl.substring(0, idx);
    return {
        authorizeUrl: basePath + '/oauth2/authorize',
        tokenUrl: basePath + '/oauth2/token'
    };
}

/**
 * Build all health system records from the Epic endpoint list + overrides + sandbox.
 */
function buildHealthSystems() {
    const systems = [];
    const seenSlugs = new Set();

    for (const ep of epicEndpoints) {
        const name = ep.OrganizationName;
        const slug = toSlug(name);

        // Skip duplicates (some orgs share the same FHIR proxy)
        if (seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        const override = manualOverrides[slug];

        if (override) {
            // Use verified endpoints
            systems.push({
                name,
                slug,
                fhirBaseUrl: override.fhirBaseUrl,
                authorizeUrl: override.authorizeUrl,
                tokenUrl: override.tokenUrl,
                city: override.city || '',
                state: override.state || '',
                isActive: true
            });
        } else {
            // Auto-derive R4 and OAuth URLs
            const fhirBaseUrl = toR4Url(ep.FHIRPatientFacingURI);
            const { authorizeUrl, tokenUrl } = deriveOAuthUrls(fhirBaseUrl);

            systems.push({
                name,
                slug,
                fhirBaseUrl,
                authorizeUrl,
                tokenUrl,
                city: '',
                state: '',
                isActive: true
            });
        }
    }

    // Always include Epic Sandbox for development/testing
    if (!seenSlugs.has('epic-sandbox')) {
        systems.push({
            name: 'Epic Sandbox (Testing)',
            slug: 'epic-sandbox',
            fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
            authorizeUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
            tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
            city: 'Verona',
            state: 'WI',
            isActive: true
        });
    }

    return systems;
}

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const healthSystems = buildHealthSystems();
        console.log(`Processing ${healthSystems.length} health systems...\n`);

        let created = 0;
        let updated = 0;

        for (const hs of healthSystems) {
            const existing = await HealthSystem.findOne({ slug: hs.slug });
            const result = await HealthSystem.findOneAndUpdate(
                { slug: hs.slug },
                hs,
                { upsert: true, new: true }
            );
            if (existing) {
                updated++;
            } else {
                created++;
            }
        }

        console.log(`Done — ${healthSystems.length} health systems processed.`);
        console.log(`  Created: ${created}`);
        console.log(`  Updated: ${updated}`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
