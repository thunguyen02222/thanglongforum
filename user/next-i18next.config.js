const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'vi',
    locales: [
      'vi', 'en', 'zh', 'ja', 'ko', 'th', 'id', 'es', 'fr', 'de', 'pt', 'ru'
    ]
  },
  localePath:
    typeof window === 'undefined'
      ? path.resolve(process.cwd(), 'public', 'locales')
      : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development'
};
