import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}", "<rootDir>/test/**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "src/domain/**/*.ts",
    "src/features/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/.gitkeep",
  ],
  clearMocks: true,
};

export default createJestConfig(config);
