"use strict";
/**
 * Jest setup file
 * Runs before all tests
 */
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MOCK_LLM = 'true';
process.env.MOCK_ACTIONS = 'true';
process.env.MOCK_RETRIEVAL = 'true';
process.env.MOCK_BROWSER = 'true';
process.env.RL_BYPASS = 'true';
process.env.CONVEX_URL = 'http://localhost:3210';
process.env.PORT = '2198';
process.env.LOG_LEVEL = 'error'; // Reduce test noise
process.env.LOG_FILE = 'false';
process.env.LOG_PERSIST = 'false';
// Mock logger to avoid initialization issues during tests
jest.mock('../src/core/logging/logger', () => ({
    logger: {
        child: jest.fn(() => ({
            verbose: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        })),
        verbose: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
