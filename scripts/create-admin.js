// Script to create an admin user
// Run with: node scripts/create-admin.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

async function createAdmin() {
  const uri = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    console.error('❌ MONGO_URL and DB_NAME must be set in .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@trustscan.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('To reset password, delete the user and run this script again.');
      return;
    }

    // Create admin user
    const adminPassword = 'Admin@123'; // Change this!
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    const adminUser = {
      _id: uuidv4(),
      email: 'admin@trustscan.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date()
    };

    await usersCollection.insertOne(adminUser);

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password immediately after first login!');
    console.log('');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

createAdmin();
