/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  moduleNameMapper: { //Fixes import/export of d3 module by pointing to bundled version of d3
    '^d3$': '<rootDir>/cli/node_modules/d3/dist/d3.js',
  },
  verbose: true, 
  silent: false,
  testTimeout: 20000,
};