const { register } = require('esbuild-register/dist/node');

// Register TypeScript compilation
register({
  target: 'node18'
});

// Set development environment
process.env.NODE_ENV = 'development';

// Start the server
require('./server/index.ts');