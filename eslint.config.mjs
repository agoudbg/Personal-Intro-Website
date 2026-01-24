import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    // Remember to specify the file glob here, otherwise it might cause the vue plugin to handle non-vue files
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': [2, {
        order: [['script', 'template'], 'style'],
      }],
      'vue/html-self-closing': 0,
      'vue/custom-event-name-casing': [2, 'kebab-case'],
      'vue/singleline-html-element-content-newline': 0,
      'vue/first-attribute-linebreak': 0,
      'vue/define-macros-order': [2, {
        order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
        defineExposeLast: false,
      }],
      'vue/html-indent': 0,
      'vue/html-closing-bracket-newline': 0,
    },
  },
  {
    rules: {
      curly: [0, 'all'],
      'dot-notation': 0,
      'no-new': 0,
      'no-console': 'off',
      'no-process-env': 0,
      'indent': [2, 2, { SwitchCase: 1 }],
      'arrow-parens': [2, 'always'],
      'brace-style': [2, '1tbs', { allowSingleLine: true }],
      'comma-dangle': [2, 'always-multiline'],
      'node/prefer-global/process': 0,
      quotes: [2, 'single', { avoidEscape: true }],
      'antfu/top-level-function': 0,
      'antfu/if-newline': 0,
      'semi': [2, 'always'],
      'node/prefer-global/buffer': 0,
      'eol-last': ['error', 'always'],
    },
  },
);
