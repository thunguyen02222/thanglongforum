const { DB, COLLECTION } = require('../migrations/lib');

module.exports = async () => {
  try {
    console.time('List migrations');

    const migrationDoc = await DB.collection(COLLECTION.MIGRATIONS).findOne({});

    if (!migrationDoc || !Array.isArray(migrationDoc.migrations)) {
      console.log('⚠️ No migrations found');
      return;
    }

    console.log(`\n📋 Total migrations: ${migrationDoc.migrations.length}\n`);
    console.log('Last run:', migrationDoc.lastRun || 'N/A');
    console.log('\n--- Migration List ---\n');

    migrationDoc.migrations.forEach((m, index) => {
      const date = m.timestamp ? new Date(m.timestamp).toISOString() : 'N/A';
      console.log(`${index + 1}. ${m.title}`);
      console.log(`   Timestamp: ${date}`);
    });

    console.log('\n--- End of List ---\n');
    console.timeEnd('List migrations');
  } catch (error) {
    console.error('❌ Error listing migrations:', error);
  }
};

