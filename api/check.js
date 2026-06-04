const { MongoClient } = require('mongodb');
const fs = require('fs');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017/base-code');
  try {
    await client.connect();
    const db = client.db('base-code');
    const cols = await db.collection('questions').find({ title: /asd/i }).toArray();
    let out = '';
    for (const doc of cols) {
      out += 'Title: ' + doc.title + '\n';
      out += 'Content: ' + doc.content + '\n';
      out += '-------------------------\n';
    }
    fs.writeFileSync('output.txt', out);
  } finally {
    await client.close();
  }
}
run();
