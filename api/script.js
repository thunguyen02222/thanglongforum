require('dotenv').config();
const mongoose = require('mongoose');

const args = process.argv.slice(2);

if (!args.length || !args[0]) {
  console.log('Missing script name. Usage: node script.js <script-file-name>');
  console.log('Example: node script.js clean-migrates');
  process.exit(1);
}

const file = args[0];
console.log(`Starting script: ${file}...`);

setTimeout(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // eslint-disable-next-line global-require, import/no-dynamic-require
    await require(`./scripts/${file}`)();

    console.log('Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
});

