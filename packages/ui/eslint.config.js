import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['*apps/client*', '*apps/admin*', '@mandys/client', '@mandys/admin', '*packages/shared*', '@mandys/shared'],
          message: 'Boundary Violation: UI package cannot import from Apps or Shared package.'
        }]
      }]
    }
  }
)
