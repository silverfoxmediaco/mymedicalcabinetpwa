#!/usr/bin/env node

/**
 * CLI script to create the first super_admin account.
 *
 * Usage:
 *   node server/scripts/createAdmin.js --email admin@mymedicalcabinet.com --password YourPass123! --firstName James --lastName McEwen
 *
 * Only creates if no super_admin exists yet.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    parsed[key] = value;
  }

  return parsed;
}

async function createSuperAdmin() {
  const args = parseArgs();

  // Validate required args
  const required = ['email', 'password', 'firstName', 'lastName'];
  const missing = required.filter((key) => !args[key]);

  if (missing.length > 0) {
    console.error(`Missing required arguments: ${missing.join(', ')}`);
    console.error(
      'Usage: node server/scripts/createAdmin.js --email <email> --password <password> --firstName <name> --lastName <name>'
    );
    process.exit(1);
  }

  // Validate password strength
  if (args.password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if a super_admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.error(
        `A super_admin already exists: ${existingSuperAdmin.email}`
      );
      console.error(
        'Only one super_admin can be created via this script. Use the admin panel to create additional admins.'
      );
      process.exit(1);
    }

    // Check if email is already in use
    const existingEmail = await Admin.findOne({ email: args.email });
    if (existingEmail) {
      console.error(`An admin with email ${args.email} already exists.`);
      process.exit(1);
    }

    // Create the super_admin
    const admin = await Admin.create({
      email: args.email,
      password: args.password,
      firstName: args.firstName,
      lastName: args.lastName,
      role: 'super_admin',
    });

    console.log('Super admin created successfully:');
    console.log(`  Email:     ${admin.email}`);
    console.log(`  Name:      ${admin.firstName} ${admin.lastName}`);
    console.log(`  Role:      ${admin.role}`);
    console.log(`  ID:        ${admin._id}`);
    console.log('\nYou can now login at /admin/login');
  } catch (error) {
    console.error('Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSuperAdmin();
