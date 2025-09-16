const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../config/firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

/**
 * Send a push notification to a specific device
 * @param {Object} options - Notification options
 * @param {string} options.token - Device registration token
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} options.data - Additional data to send with the notification
 * @returns {Promise<admin.messaging.MessagingDevicesResponse>}
 */
const sendPushNotification = async ({ token, title, body, data = {} }) => {
  try {
    if (!token) {
      throw new Error('Device token is required');
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'prayer_reminders',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          requireInteraction: 'true',
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent successfully to token: ${token}`, { response });
    return response;
  } catch (error) {
    logger.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send a multicast notification to multiple devices
 * @param {Object} options - Notification options
 * @param {string[]} options.tokens - Array of device tokens
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} options.data - Additional data to send with the notification
 * @returns {Promise<admin.messaging.BatchResponse>}
 */
const sendMulticastNotification = async ({ tokens, title, body, data = {} }) => {
  try {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      throw new Error('At least one device token is required');
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'prayer_reminders',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          requireInteraction: 'true',
        },
      },
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    
    // Check for any failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error,
          });
        }
      });
      
      logger.warn(`Failed to send notifications to ${failedTokens.length} devices`, {
        failedTokens,
      });
    }

    logger.info(`Successfully sent ${response.successCount} notifications`);
    return response;
  } catch (error) {
    logger.error('Error sending multicast notification:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
};
