import react from 'eslint-plugin-react';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';

export default [
  {
    ignores: ['build'],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react,
    },
    ...reactRecommended,
    languageOptions: {
      ...reactRecommended.languageOptions,
    },
    rules: {
      ...reactRecommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
];
