const {
  DB, COLLECTION, encryptPassword, generateSalt
} = require('./lib');

const defaultPassword = 'adminadmin';

async function createAuth(newUser, userId) {
  const salt = generateSalt();
  const authCheck = await DB.collection(COLLECTION.AUTH).findOne({
    userId
  });

  if (!authCheck) {
    await DB.collection(COLLECTION.AUTH).insertOne({
      userId,
      email: newUser.email,
      username: newUser.username,
      salt,
      password: encryptPassword(defaultPassword, salt),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created auth for user: ${newUser.email}`);
  }
}

module.exports.up = async function up(next) {
  const user = {
    name: 'Admin',
    email: `admin@${process.env.DOMAIN || 'yopmail.com'}`,
    username: 'admin',
    role: 'admin',
    status: 'active'
  };

  const existingUser = await DB.collection(COLLECTION.USER).findOne({
    $or: [
      { email: user.email },
      { username: user.username }
    ]
  });

  if (existingUser) {
    console.log(`User with email ${user.email} or username ${user.username} already exists`);
    next();
    return;
  }

  try {
    console.log(`Creating admin user: ${user.username}`);

    const result = await DB.collection(COLLECTION.USER).insertOne({
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await createAuth(user, result.insertedId);

    console.log('Admin user created successfully');
    console.log(`Email: ${user.email}`);
    console.log(`Username: ${user.username}`);
    console.log(`Password: ${defaultPassword}`);
  } catch (e) {
    console.error('Error creating admin user:', e);
  }

  next();
};

module.exports.down = function down(next) {
  next();
};

