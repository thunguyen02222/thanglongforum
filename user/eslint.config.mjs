import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'next/core-web-vitals', 'next/typescript', 'airbnb'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-nested-ternary': 'off',
      '@next/next/no-img-element': 'off',
      'import/no-unresolved': 0,
      'react/jsx-filename-extension': [
        1,
        {
          extensions: [
            '.js',
            '.ts',
            '.jsx',
            '.tsx'
          ]
        }
      ],
      quotes: [
        'error',
        'single'
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
          '': 'never'
        }
      ],
      'import/prefer-default-export': 0,
      'no-underscore-dangle': 0,
      'max-classes-per-file': 0,
      'max-len': 0,
      'max-lines': 0,
      'no-useless-constructor': 0,
      'no-empty-function': 0,
      'comma-dangle': [
        'error',
        'never'
      ],
      'class-methods-use-this': 0,
      'no-unused-expressions': 0,
      'no-unused-vars': 0,
      '@typescript-eslint/camelcase': 0,
      camelcase: 0,
      'no-use-before-define': 'off',
      'jsx-a11y/anchor-is-valid': 0,
      'jsx-a11y/control-has-associated-label': 'off',
      'import/no-extraneous-dependencies': 0,
      'jsx-a11y/media-has-caption': 0,
      'react/jsx-props-no-spreading': 0,
      'react/state-in-constructor': 0,
      'react/jsx-no-bind': 0,
      'react/destructuring-assignment': 0,
      'no-shadow': [
        'error',
        {
          hoist: 'never'
        }
      ],
      'no-alert': 0,
      'react/sort-comp': [
        1,
        {
          order: [
            'static-variables',
            'instance-variables',
            'static-methods',
            'lifecycle',
            '/^on.+$/',
            'everything-else',
            'render'
          ]
        }
      ],
      'react/require-default-props': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/no-children-prop': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react/no-invalid-html-attribute': 'off',
      'no-param-reassign': 'off',
      'import/no-cycle': 'off'
    }
  })
];

export default eslintConfig;
