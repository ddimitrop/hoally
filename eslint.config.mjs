import prettier from 'eslint-config-prettier';
import google from 'eslint-config-google-jsdocless';

export default [
  ...[
    {
      ignores: ['app'],
    },
  ]
    .concat(google)
    .concat(prettier),
];
