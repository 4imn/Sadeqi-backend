const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { version } = require('./package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sadeqi API Documentation',
      version,
      description: 'API documentation for Sadeqi - Prayer and Medicine Reminder App',
      contact: {
        name: 'Sadeqi Support',
        email: 'support@sadeqi.app'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.sadeqi.app/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Device: {
          type: 'object',
          properties: {
            deviceId: {
              type: 'string',
              description: 'Unique identifier for the device',
              example: 'a1b2c3d4e5f6g7h8i9j0'
            },
            token: {
              type: 'string',
              description: 'FCM token for push notifications',
              example: 'fcm-token-string-here'
            },
            platform: {
              type: 'string',
              enum: ['android', 'ios', 'web'],
              description: 'Device platform'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the device is active and should receive notifications'
            },
            metadata: {
              type: 'object',
              properties: {
                countryCode: {
                  type: 'string',
                  description: 'ISO 3166-1 alpha-2 country code',
                  example: 'SA',
                  default: 'SA'
                },
                firstSeen: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When the device was first registered'
                },
                lastUpdated: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When the device was last updated'
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Device not found'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Sadeqi API Documentation'
  }));

  // API docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};
