import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['*apps/client*', '*apps/admin*', '@mandys/client', '@mandys/admin', '*packages/ui*', '@mandys/ui', 'react', 'react-dom'],
          message: 'Boundary Violation: Shared package cannot import React, Apps, or UI package.'
        }]
      }]
    }
  }
)
