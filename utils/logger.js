const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align } = format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata, null, 2);
  }
  return msg;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    consoleFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: format.combine(
        format.uncolorize(),
        format.json()
      )
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      format: format.combine(
        format.uncolorize(),
        format.json()
      )
    })
  ],
  exitOnError: false
});

// Create a stream object for morgan
logger.stream = {
  write: function (message, encoding) {
    logger.info(message.trim());
  }
};

module.exports = logger;
