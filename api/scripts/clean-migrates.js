const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  try {
    console.time('Clean migrations');

    const migrationDoc = await DB.collection(COLLECTION.MIGRATIONS).findOne({});

    if (!migrationDoc) {
      console.log('⚠️ No migrations document found');
      return;
    }

    // Delete all migrations
    await DB.collection(COLLECTION.MIGRATIONS).deleteMany({});

    console.log('✅ All migrations have been deleted');
    console.log('ℹ️ Run "yarn migrate" to re-run all migrations');

    console.timeEnd('Clean migrations');
  } catch (error) {
    console.error('❌ Error cleaning migrations:', error);
  }
};

