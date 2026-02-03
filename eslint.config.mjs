import airbnbBase from '@chalp/eslint-airbnb/base';
import airbnbReact from '@chalp/eslint-airbnb/react';
import airbnbTypescript from '@chalp/eslint-airbnb/typescript';

export default [
  ...airbnbBase,
  ...airbnbReact,
  ...airbnbTypescript,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
          project: [
            'tsconfig.node.json',
            'tsconfig.app.json',
          ],
        },
      },
      react: {
        version: "18"
      }

    }
  },
  {
    rules: {
      '@stylistic/max-len': ["error", { "code": 120 }]
    }
  }
];
