const { createMedicineReminder, getDueReminders, updateLastReminderSent } = require('../services/medicine.service');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect MongoDB:", err);
    process.exit(1);
  }
})();

async function testMedicineNotification() {
  try {
    console.log('🚀 Starting medicine notification test...');
    console.log('Current time:', new Date().toISOString());
    
    // Create a test medicine that will be activated after one minute

    const now = new Date();
    const testReminderTime = new Date(now.getTime() + 1 * 60 * 1000); // بعد دقيقة واحدة
    
    console.log('Test medicine reminder will be at:', testReminderTime.toISOString());
    
    const utcTime = testReminderTime.getUTCHours().toString().padStart(2, '0') + ':' +
                testReminderTime.getUTCMinutes().toString().padStart(2, '0');
// Test medicine data
    const testMedicineData = {
      name: 'Test Medicine - Ibuprofen',
      reminderType: 'specific_time',
      specificTime: {
        time: utcTime, // HH:MM
        frequency: 1, // Once
        offsets: {
          before: 0,
          after1: 0,
          after2: 0
        }
      },
      enabled: true,
      notes: 'Test medicine for notification system'
    };
    
    console.log('Creating test medicine with data:', JSON.stringify(testMedicineData, null, 2));
    
    // Create the medicine (use a test user ID)
    const testUserId = new mongoose.Types.ObjectId(); // Test user ID

    const medicine = await createMedicineReminder(testUserId, testMedicineData);
    
    console.log('✅ Test medicine created successfully:', medicine._id);
    console.log('⏳ Waiting for medicine time... (checking every 2 seconds)');
    
// Check due medicines every two seconds
    const interval = setInterval(async () => {
      const currentTime = new Date();
      console.log(`\n[${currentTime.toISOString()}] Checking for due medicines...`);
      
      try {
        const dueMedicines = await getDueReminders(currentTime);
        
        if (dueMedicines.length > 0) {
          console.log('\n🎉 Medicine reminder notification triggered!');
          console.log('Due medicines:', JSON.stringify(dueMedicines, null, 2));
          
// Update the time of the last sent notification
          for (const medicine of dueMedicines) {
            await updateLastReminderSent(medicine._id);
            console.log(`✅ Updated last reminder time for medicine: ${medicine._id}`);
          }
          
          clearInterval(interval);
          console.log('✅ Test completed successfully!');
          process.exit(0);
        } else {
          console.log('No due medicines found. Next check in 2 seconds...');
        }
      } catch (error) {
        console.error('Error during check:', error);
        clearInterval(interval);
        process.exit(1);
      }
    }, 2000);
    
// Stop the test after a maximum of 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      console.log('❌ Test timeout after 5 minutes');
      process.exit(1);
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMedicineNotification();