/**
 * Test setup configuration
 * Sets up global test utilities and configurations
 */

import { DataStore } from "../store/DataStore";

// Set test environment
process.env.NODE_ENV = "test";

// Global test setup
beforeEach(() => {
  // Reset data store before each test to ensure clean state
  const dataStore = DataStore.getInstance();
  dataStore.reset();

  // Clear rate limiter store if it exists
  try {
    const { getRateLimitStats } = require("../middleware/rateLimiter");
    // Clear all rate limit data
    const stats = getRateLimitStats();
    if (stats.totalKeys > 0) {
      // Note: In a real implementation, we'd want a clearAll method
      // For now, the high limits should prevent issues
    }
  } catch (error) {
    // Ignore if rateLimiter is not available
  }
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidDate(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidDate(received: string | Date) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
});

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === "test") {
  // Suppress console output during tests unless specifically needed
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
}
