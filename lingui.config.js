module.exports = {
  catalogs: [
    {
      path: 'src/localization/{locale}/messages',
      include: ['<rootDir>/src/'],
    },
  ],
  locales: ['de', 'en', 'es', 'fr', 'it', 'ko', 'pl', 'pt', 'ru', 'zh'],
  sourceLocale: 'en',
  fallbackLocales: {
    default: 'en',
  },
  format: 'minimal',
};
