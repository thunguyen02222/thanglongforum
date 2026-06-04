const { execSync } = require('child_process');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'migrations');

try {
  console.log('Checking migrations...');
  execSync(`node ${path.join(__dirname, '..', 'migrate.js')}`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('Migrations check completed.');
} catch (error) {
  console.error('Migration check failed:', error.message);
  process.exit(1);
}

