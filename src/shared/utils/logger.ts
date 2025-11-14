import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../../config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Remove empty objects
      const cleanMeta = Object.fromEntries(
        Object.entries(meta).filter(([_, v]) => v !== undefined && v !== null)
      );
      
      if (Object.keys(cleanMeta).length > 0) {
        logMessage += `\n${JSON.stringify(cleanMeta, null, 2)}`;
      }
    }
    
    return logMessage;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (config.nodeEnv === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transport with daily rotation for errors
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
  })
);

// File transport with daily rotation for all logs
transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: structuredFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
  })
);

// Create logger instance
const winstonLogger = winston.createLogger({
  level: config.logging.level,
  levels,
  transports,
  exitOnError: false,
});

// Add request context to logger
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private baseLogger: winston.Logger;

  constructor(baseLogger: winston.Logger) {
    this.baseLogger = baseLogger;
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const logData: any = {
      message,
      ...context,
    };

    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        logData.error = error;
      }
    }

    this.baseLogger.error(logData);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.baseLogger.warn({
      message,
      ...context,
    });
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.baseLogger.info({
      message,
      ...context,
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.baseLogger.debug({
      message,
      ...context,
    });
  }

  /**
   * Create child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = this.baseLogger.child(defaultContext);
    return new Logger(childLogger);
  }
}

export const logger = new Logger(winstonLogger);

// Export for testing
export { winston };
