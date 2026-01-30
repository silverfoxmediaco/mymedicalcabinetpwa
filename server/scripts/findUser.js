// Run this script from the server directory: node scripts/findUser.js
require('dotenv').config();
const mongoose = require('mongoose');

const email = process.argv[2] || 'jmcewenpl@gmail.com';

async function findUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await mongoose.connection.db.collection('users').findOne({ email });

        if (user) {
            console.log('\n=== User Found ===');
            console.log('ID:', user._id);
            console.log('Email:', user.email);
            console.log('Name:', user.firstName, user.lastName);
            console.log('Email Verified:', user.isEmailVerified);
            console.log('Created:', user.createdAt);
            console.log('Last Login:', user.lastLogin);
            console.log('\nFull document:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('No user found with email:', email);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

findUser();
