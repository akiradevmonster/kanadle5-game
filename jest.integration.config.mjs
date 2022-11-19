import nextJest from 'next/jest.js';

// Set environment variables for integration tests
process.env.NODE_ENV = 'test';
process.env.KV_REST_API_URL = process.env.KV_REST_API_URL || 'http://upstash-redis:80';
process.env.KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || 'local-token';
process.env.NEXT_PUBLIC_LIFF_ID = 'test-liff-id';
process.env.LIFF_CHANNEL_ID = 'test-channel-id';
process.env.LIFF_CHANNEL_SECRET = 'test-channel-secret';
process.env.DAILY_WORD_REFRESH_TIME = '00:00:00';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.integration.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/integration/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/src/**/*.integration.(test|spec).(ts|tsx|js|jsx)',
  ],
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: 1, // Run integration tests sequentially to avoid conflicts
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|@upstash/redis|uncrypto)/)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

export default createJestConfig(customJestConfig);