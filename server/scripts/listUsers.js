// List all users in the database
require('dotenv').config();
const mongoose = require('mongoose');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await mongoose.connection.db.collection('users').find({}).toArray();

        console.log('\n=== All Users ===');
        console.log('Total users:', users.length);

        users.forEach((user, index) => {
            console.log(`\n--- User ${index + 1} ---`);
            console.log('ID:', user._id);
            console.log('Email:', user.email);
            console.log('Name:', user.firstName, user.lastName);
            console.log('Email Verified:', user.isEmailVerified);
            console.log('Created:', user.createdAt);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listUsers();
