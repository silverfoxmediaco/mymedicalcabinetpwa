/**
 * Seed health systems into the database.
 * Idempotent — safe to run multiple times.
 *
 * Usage: node server/scripts/seedHealthSystems.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const HealthSystem = require('../models/HealthSystem');

const healthSystems = [
    {
        name: 'Baylor Scott & White',
        slug: 'baylor-scott-white',
        fhirBaseUrl: 'https://rxproxy.sw.org/FHIR-PRD/BSW/api/FHIR/R4',
        authorizeUrl: 'https://epicproxy.bswhealth.org/FHIR-PRD/oauth2/authorize',
        tokenUrl: 'https://epicproxy.bswhealth.org/FHIR-PRD/oauth2/token',
        city: 'Dallas',
        state: 'TX',
        isActive: true
    },
    {
        name: 'Texas Health Resources',
        slug: 'texas-health-resources',
        fhirBaseUrl: 'https://epproxy.texashealth.org/FHIR/api/FHIR/R4',
        authorizeUrl: 'https://epproxy.texashealth.org/FHIR/oauth2/authorize',
        tokenUrl: 'https://epproxy.texashealth.org/FHIR/oauth2/token',
        city: 'Arlington',
        state: 'TX',
        isActive: true
    },
    {
        name: "Cook Children's Health Care System",
        slug: 'cook-childrens',
        fhirBaseUrl: 'https://cookicfg.cookchildrens.org/CookFHIR/api/FHIR/R4',
        authorizeUrl: 'https://cookicfg.cookchildrens.org/CookFHIR/oauth2/authorize',
        tokenUrl: 'https://cookicfg.cookchildrens.org/CookFHIR/oauth2/token',
        city: 'Fort Worth',
        state: 'TX',
        isActive: true
    },
    {
        name: 'Epic Sandbox (Testing)',
        slug: 'epic-sandbox',
        fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
        authorizeUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
        tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
        city: 'Verona',
        state: 'WI',
        isActive: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const hs of healthSystems) {
            const result = await HealthSystem.findOneAndUpdate(
                { slug: hs.slug },
                hs,
                { upsert: true, new: true }
            );
            console.log(`Upserted: ${result.name} (${result.slug})`);
        }

        console.log(`\nDone — ${healthSystems.length} health systems seeded.`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
