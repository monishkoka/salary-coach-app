module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', '/node_modules/*', 'supabase/functions/**'],
  rules: {
    'import/order': 'off',
  },
};
