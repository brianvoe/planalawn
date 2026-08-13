import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist/**', 'docs/**', 'node_modules/**'] },
  ...pluginVue.configs['flat/base'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/block-order': ['error', { order: ['script', 'style', 'template'] }],
      'vue/order-in-components': [
        'error',
        {
          order: [
            'name',
            ['components', 'directives', 'mixins'],
            'inheritAttrs',
            ['props', 'emits'],
            'setup',
            'data',
            'beforeCreate',
            'created',
            'beforeMount',
            'mounted',
            'beforeUpdate',
            'updated',
            'activated',
            'deactivated',
            'beforeUnmount',
            'unmounted',
            'renderTracked',
            'renderTriggered',
            'errorCaptured',
            'watch',
            'computed',
            'methods',
          ],
        },
      ],
    },
  },
]
