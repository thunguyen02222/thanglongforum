const { DB, COLLECTION } = require('./lib');

const SITE_SETTINGS = [
  {
    key: 'site_name',
    value: 'Base Code',
    name: 'Tên website',
    description: 'Tên hiển thị của website',
    type: 'text',
    group: 'general',
    ordering: 1,
    visible: true,
    editable: true,
    public: true
  },
  {
    key: 'site_logo',
    value: '',
    name: 'Logo',
    description: 'URL hoặc đường dẫn ảnh logo (hiển thị trên header, sidebar)',
    type: 'text',
    group: 'general',
    ordering: 2,
    visible: true,
    editable: true,
    public: true
  },
  {
    key: 'site_favicon',
    value: '',
    name: 'Favicon',
    description: 'URL hoặc đường dẫn ảnh favicon (icon trên tab trình duyệt)',
    type: 'text',
    group: 'general',
    ordering: 3,
    visible: true,
    editable: true,
    public: true
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
    for (const setting of SITE_SETTINGS) {
      await upsertSetting(setting);
      console.log(`Site setting upserted: ${setting.key}`);
    }
    console.log('Site settings migration completed.');
  } catch (e) {
    console.error('Site settings migration error:', e);
  }
  next();
};

module.exports.down = async function down(next) {
  try {
    const keys = SITE_SETTINGS.map((s) => s.key);
    await DB.collection(COLLECTION.SETTING).deleteMany({ key: { $in: keys } });
    console.log('Site settings removed');
  } catch (e) {
    console.error('Site settings rollback error:', e);
  }
  next();
};
