require('dotenv').config();

const migrate = require('migrate');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');

/**
 * Custom MongoDB store for migrate
 */
class MongoDbStore {
  async load(fn) {
    let client = null;
    try {
      client = await MongoClient.connect(process.env.MONGO_URI);
      const db = client.db();
      const docs = await db.collection('migrations').find().toArray();

      if (docs.length !== 1) {
        console.log('ℹ️ No migration state found. This is normal on first run.');
        return fn(null, {});
      }

      return fn(null, docs[0]);
    } catch (err) {
      return fn(err);
    } finally {
      if (client) await client.close();
    }
  }

  async save(set, fn) {
    let client = null;
    try {
      client = await MongoClient.connect(process.env.MONGO_URI);
      const db = client.db();
      const collection = db.collection('migrations');

      const existingDoc = await collection.findOne({});
      const existingTitles = new Set(
        Array.isArray(existingDoc?.migrations) ? existingDoc.migrations.map((m) => m.title) : []
      );

      // Filter duplicates in set.migrations even in the same run
      const seen = new Set();
      const uniqueMigrations = (set.migrations || []).filter((m) => {
        if (!m || typeof m.title !== 'string' || typeof m.timestamp !== 'number') return false;
        if (existingTitles.has(m.title)) return false; // already in DB
        if (seen.has(m.title)) return false; // encountered in current run
        seen.add(m.title);
        return true;
      });

      const update = {
        $set: {
          lastRun: set.lastRun
        }
      };

      if (uniqueMigrations.length > 0) {
        update.$push = {
          migrations: { $each: uniqueMigrations }
        };
      }

      const result = await collection.updateOne({}, update, { upsert: true });
      return fn(null, result);
    } catch (err) {
      return fn(err);
    } finally {
      if (client) await client.close();
    }
  }
}

/**
 * Main migration runner
 */
migrate.load(
  {
    stateStore: new MongoDbStore(),

    migrationsDirectory: path.join(__dirname, './migrations'),

    filterFunction: (fileName) => fileName.endsWith('.js') && !fileName.includes('lib/')
  },
  async (err, set) => {
    if (err) throw err;

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    set.up((err2) => {
      if (err2) throw err2;

      console.log('✅ Migrations successfully ran');
      process.exit();
    });
  }
);

