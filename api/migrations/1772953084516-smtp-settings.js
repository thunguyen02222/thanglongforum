const { DB, COLLECTION } = require('./lib');

const SMTP_SETTINGS = [
  {
    key: 'smtp_enabled',
    value: true,
    name: 'Bật gửi email (SMTP)',
    description: 'Bật/tắt chức năng gửi email qua SMTP',
    type: 'boolean',
    group: 'smtp',
    ordering: 0,
    visible: true,
    editable: true,
    public: false
  },
  {
    key: 'smtp_host',
    value: 'smtp.gmail.com',
    name: 'SMTP Host',
    description: 'SMTP server host (e.g. smtp.gmail.com for Google)',
    type: 'text',
    group: 'smtp',
    ordering: 1,
    visible: true,
    editable: true,
    public: false
  },
  {
    key: 'smtp_port',
    value: 587,
    name: 'SMTP Port',
    description: 'SMTP port (587 for TLS, 465 for SSL)',
    type: 'number',
    group: 'smtp',
    ordering: 2,
    visible: true,
    editable: true,
    public: false
  },
  {
    key: 'smtp_user',
    value: '',
    name: 'SMTP User',
    description: 'Email address used to send mail (Gmail address)',
    type: 'text',
    group: 'smtp',
    ordering: 3,
    visible: true,
    editable: true,
    public: false
  },
  {
    key: 'smtp_pass',
    value: '',
    name: 'SMTP Password',
    description: 'App password for Gmail (16 chars, no spaces)',
    type: 'password',
    group: 'smtp',
    ordering: 4,
    visible: false,
    editable: true,
    public: false
  },
  {
    key: 'mail_from',
    value: '',
    name: 'Mail From',
    description: 'From address shown on sent emails',
    type: 'text',
    group: 'smtp',
    ordering: 5,
    visible: true,
    editable: true,
    public: false
  }
];

async function upsertSetting(setting) {
  await DB.collection(COLLECTION.SETTING).updateOne(
    { key: setting.key },
    {
      $set: {
        ...setting,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

module.exports.up = async function up(next) {
  try {
    for (const setting of SMTP_SETTINGS) {
      await upsertSetting(setting);
      console.log(`SMTP setting upserted: ${setting.key}`);
    }
    console.log('SMTP settings migration completed.');
  } catch (e) {
    console.error('SMTP settings migration error:', e);
  }
  next();
};

module.exports.down = async function down(next) {
  try {
    const keys = SMTP_SETTINGS.map((s) => s.key);
    await DB.collection(COLLECTION.SETTING).deleteMany({ key: { $in: keys } });
    console.log('SMTP settings removed');
  } catch (e) {
    console.error('SMTP settings rollback error:', e);
  }
  next();
};
