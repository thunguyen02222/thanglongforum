const { DB, COLLECTION } = require('../migrations/lib');

// List of migration titles to remove
// Modify this array to specify which migrations to remove
const MIGRATIONS_TO_REMOVE = [
  // Example: '1736842800000-sample.js'
];

module.exports = async () => {
  try {
    console.time('Remove migrations');

    if (!MIGRATIONS_TO_REMOVE.length) {
      console.log('⚠️ No migrations specified to remove');
      console.log('ℹ️ Edit scripts/remove-migration.js and add migration titles to MIGRATIONS_TO_REMOVE array');
      return;
    }

    for (const migrationToRemove of MIGRATIONS_TO_REMOVE) {
      const result = await DB.collection(COLLECTION.MIGRATIONS).updateOne(
        {},
        {
          $pull: {
            migrations: { title: migrationToRemove }
          },
          $set: {
            lastRun: null
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Removed migration: "${migrationToRemove}"`);
      } else {
        console.log(`⚠️ Migration not found: "${migrationToRemove}"`);
      }
    }

    console.timeEnd('Remove migrations');
  } catch (error) {
    console.error('❌ Error removing migrations:', error);
  }
};

