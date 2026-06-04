const { DB, COLLECTION } = require('./lib');

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

const GOOGLE_OAUTH_SETTINGS = [
  {
    key: 'enable_google_login',
    value: false,
    name: 'Bật đăng nhập bằng Google',
    description: 'Khi bật, người dùng có thể đăng nhập/đăng ký bằng tài khoản Google trên giao diện',
    type: 'boolean',
    group: 'auth',
    ordering: 1,
    visible: true,
    editable: true,
    public: true
  },
  {
    key: 'google_oauth_client_id',
    value: clientId,
    name: 'Google OAuth Client ID',
    description: 'Client ID từ Google Cloud Console (Credentials)',
    type: 'text',
    group: 'auth',
    ordering: 2,
    visible: true,
    editable: true,
    public: true
  },
  {
    key: 'google_oauth_client_secret',
    value: clientSecret,
    name: 'Google OAuth Client Secret',
    description: 'Client Secret từ Google Cloud Console (bảo mật, không hiển thị phía client)',
    type: 'password',
    group: 'auth',
    ordering: 3,
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
    for (const setting of GOOGLE_OAUTH_SETTINGS) {
      await upsertSetting(setting);
      console.log(`Google OAuth setting upserted: ${setting.key}`);
    }
    console.log('Google OAuth settings migration completed.');
  } catch (e) {
    console.error('Google OAuth settings migration error:', e);
  }
  next();
};

module.exports.down = async function down(next) {
  try {
    const keys = GOOGLE_OAUTH_SETTINGS.map((s) => s.key);
    await DB.collection(COLLECTION.SETTING).deleteMany({ key: { $in: keys } });
    console.log('Google OAuth settings removed');
  } catch (e) {
    console.error('Google OAuth settings rollback error:', e);
  }
  next();
};
