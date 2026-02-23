import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Dead code detection
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',

      // Allow explicit any for Chrome API interop
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/', 'old-version/', 'node_modules/', 'vite.config.ts'],
  }
);
