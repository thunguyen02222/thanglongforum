const crypto = require('crypto');
const mongoose = require('mongoose');

exports.COLLECTION = {
  SETTING: 'settings',
  USER: 'users',
  AUTH: 'auths',
  AUTH_SESSION: 'auth_sessions',
  FILE: 'files',
  MIGRATIONS: 'migrations',
  HTTP_EXCEPTION_LOG: 'httpexceptionlogs',
  FACULTY: 'faculties',
  MAJOR: 'majors',
  CLASS: 'classes',
  QUESTION: 'questions',
  ANSWER: 'answers',
  COMMENT: 'comments',
  VOTE: 'votes',
  TAG: 'tags',
  BOOKMARK: 'bookmarks',
  FOLLOW: 'follows',
  NOTIFICATION: 'notifications',
  REPORT: 'reports'
};

exports.DB = mongoose.connection;

exports.encryptPassword = (pw, salt) => {
  const defaultIterations = 10000;
  const defaultKeyLength = 64;

  return crypto
    .pbkdf2Sync(pw, salt, defaultIterations, defaultKeyLength, 'sha1')
    .toString('base64');
};

exports.generateSalt = (byteSize = 16) => crypto.randomBytes(byteSize).toString('base64');

