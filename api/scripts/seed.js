const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/base-code';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed settings
    const settingsData = [
      {
        key: 'site_name',
        value: 'Base Code',
        name: 'Site Name',
        description: 'The name of the site',
        type: 'text',
        group: 'general',
        ordering: 1,
        visible: true,
        editable: true,
        public: true
      },
      {
        key: 'site_description',
        value: 'Base Code',
        name: 'Site Description',
        description: 'A brief description of the site',
        type: 'text',
        group: 'general',
        ordering: 2,
        visible: true,
        editable: true,
        public: true
      }
    ];

    const Setting = mongoose.model('Setting', new mongoose.Schema({
      key: String,
      value: mongoose.Schema.Types.Mixed,
      name: String,
      description: String,
      type: String,
      group: String,
      ordering: Number,
      visible: Boolean,
      editable: Boolean,
      public: Boolean
    }, { collection: 'settings', timestamps: true }));

    for (const setting of settingsData) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }

    console.log('Settings seeded successfully');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();

