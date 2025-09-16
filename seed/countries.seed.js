require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Country = require('../models/country.model');
const connectDB = require('../config/db');

// Read countries data from JSON file
const countriesData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'data', 'countries.json'),
    'utf8'
  )
);

const seedCountries = async () => {
  try {
    // Connect to MongoDB using the same connection as the app
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing countries
    await Country.deleteMany({});
    console.log('Cleared existing countries');

    // Insert new countries
    const createdCountries = await Country.insertMany(countriesData);
    console.log(`Successfully seeded ${createdCountries.length} countries`);
    
    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('Error seeding countries:', error);
    process.exit(1);
  }
};

// Run the seeder
seedCountries();
