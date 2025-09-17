const { checkUpcomingPrayerTimes, cacheCountryPrayerTimes } = require('../services/prayer.service');
const moment = require('moment-timezone');
const { getPrayerTimestamp } = require('../services/prayer.service');

const connectDB = require('../config/db'); // أو حسب مكان ملف الاتصال عندك

(async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect MongoDB:", err);
    process.exit(1);
  }
})();


function formatTime(date) {
  return moment(date).format('HH:mm');
}

async function testPrayerNotification() {
  try {
    console.log('🚀 Starting prayer notification test...');
    console.log('Current time:', new Date().toISOString());
    
    // Create a test prayer time 1 minute from now
    const now = new Date();
    const testPrayerTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now
    
    console.log('Test prayer time will be at:', testPrayerTime.toISOString());
    
    const testPrayerTimes = {
      fajr: formatTime(testPrayerTime),
      sunrise: formatTime(new Date(testPrayerTime.getTime() + 30 * 60 * 1000)), // 30 minutes after fajr
      dhuhr: formatTime(new Date(testPrayerTime.getTime() + 5 * 60 * 60 * 1000)), // 5 hours after fajr
      asr: formatTime(new Date(testPrayerTime.getTime() + 8 * 60 * 60 * 1000)), // 8 hours after fajr
      maghrib: formatTime(new Date(testPrayerTime.getTime() + 11 * 60 * 60 * 1000)), // 11 hours after fajr
      isha: formatTime(new Date(testPrayerTime.getTime() + 12 * 60 * 60 * 1000)), // 12 hours after fajr
    };
    
    console.log('Prayer times to cache:', JSON.stringify(testPrayerTimes, null, 2));
    
    // Calculate the expected timestamp for the prayer time
    const expectedTimestamp = getPrayerTimestamp(now, testPrayerTimes.fajr);
    console.log('Expected prayer timestamp:', expectedTimestamp, new Date(expectedTimestamp * 1000).toISOString());
    
    // Cache the test prayer times
    console.log('Caching prayer times...');
    await cacheCountryPrayerTimes('AUE', now, testPrayerTimes);
    
    console.log('✅ Test prayer time set for:', testPrayerTime.toISOString());
    console.log('⏳ Waiting for prayer time... (checking every 2 seconds)');
    
    // Check for prayer times every 2 seconds
    const interval = setInterval(async () => {
      const currentTime = new Date();
      console.log(`\n[${currentTime.toISOString()}] Checking for prayer times...`);
      
      try {
        const prayers = await checkUpcomingPrayerTimes();
        if (prayers.length > 0) {
          console.log('\n🎉 Prayer time notification triggered!');
          console.log('Prayer details:', JSON.stringify(prayers, null, 2));
          clearInterval(interval);
          console.log('✅ Test completed successfully!');
          process.exit(0);
        } else {
          console.log('No prayer times found. Next check in 2 seconds...');
        }
      } catch (error) {
        console.error('Error during check:', error);
        clearInterval(interval);
        process.exit(1);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPrayerNotification();
