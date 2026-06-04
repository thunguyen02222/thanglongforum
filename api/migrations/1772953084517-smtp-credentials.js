const { DB, COLLECTION } = require('./lib');

const SMTP_UPDATES = [
  { key: 'smtp_user', value: 'learningpersonal67@gmail.com' },
  { key: 'smtp_pass', value: 'arucwyjjqeoqwxuh' },
  { key: 'mail_from', value: 'learningpersonal67@gmail.com' }
];

module.exports.up = async function up(next) {
  try {
    for (const item of SMTP_UPDATES) {
      await DB.collection(COLLECTION.SETTING).updateOne(
        { key: item.key },
        { $set: { value: item.value, updatedAt: new Date() } }
      );
      console.log(`SMTP credential updated: ${item.key}`);
    }
    console.log('SMTP credentials migration completed.');
  } catch (e) {
    console.error('SMTP credentials migration error:', e);
  }
  next();
};

module.exports.down = async function down(next) {
  try {
    for (const item of SMTP_UPDATES) {
      await DB.collection(COLLECTION.SETTING).updateOne(
        { key: item.key },
        { $set: { value: '', updatedAt: new Date() } }
      );
    }
    console.log('SMTP credentials cleared');
  } catch (e) {
    console.error('SMTP credentials rollback error:', e);
  }
  next();
};
