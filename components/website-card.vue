<template>
  <div class="website-card" :variant="variant">
    <div class="avatar">
      <i :style="{ backgroundImage: `url(${icon})` }" />
    </div>
    <div class="info">
      <a class="name" :href="link" target="_blank" rel="noopener" tabindex="-1">{{ name }}</a>
      <div class="description">
        <div class="description-text">{{ description }} </div>
        <div class="link-text">
          <Icon class="icon" name="material-symbols:globe" />
          {{ linkText }}
        </div>
      </div>
    </div>
    <div class="actions">
      <a :href="link" target="_blank" rel="noopener">
        {{ linkActionText }}
        <Icon name="material-symbols:arrow-outward-rounded" />
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface WebsiteCardProps {
  iconUrl?: string;
  darkIconUrl?: string;
  name: string;
  description: string;
  host?: string;
  linkActionText?: string;
  link: string;
  variant?: 'default' | 'preview';
}

const props = defineProps({
  iconUrl: {
    type: String,
    required: false,
    default: '',
  },
  darkIconUrl: {
    type: String,
    required: false,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  host: {
    type: String,
    required: false,
    default: '',
  },
  linkActionText: {
    type: String,
    required: false,
    default: '查看',
  },
  link: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    required: false,
    default: 'default',
  },
});

const linkText = computed(() => {
  return props.host || new URL(props.link).host;
});

const icon = computed(() => {
  return theme.value === 'dark' && props.darkIconUrl
    ? props.darkIconUrl
    : props.iconUrl;
});

</script>

<style lang="scss" scoped>
.website-card {
  width: 100%;
  border-radius: 1.5625em;
  padding: 0.625em;
  display: flex;
  flex-direction: row;
  gap: 0.625em;
  transition: all 0.3s;
  overflow: hidden;

  .avatar {
    width: 4em;
    height: 4em;
    border-radius: 0.9375em;
    overflow: hidden;
    flex-grow: 0;
    flex-shrink: 0;
    background: var(--color-surface-avatar) center center no-repeat;
    overflow: hidden;

    i {
      display: block;
      width: 100%;
      height: 100%;
      background-position: center center;
      background-repeat: no-repeat;
      background-size: contain;
    }
  }

  .info {
    width: 0.0625em;
    margin: -0.625em 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 0.5em;
    flex-grow: 1;
    flex-shrink: 1;
    transition: all 0.3s;

    * {
      max-width: 100%;
    }

    .name {
      font-size: 1.25em;
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: all 0.3s;
    }

    .description {
      color: var(--color-text-secondary);

      .description-text {
        font-size: 0.85em;
        color: var(--color-text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: all 0.3s;
      }

      .link-text {
        visibility: hidden;
        max-height: 0px;
        opacity: 0;
        margin-top: 0.2em;
        font-size: 0.875em;
        filter: blur(4px);
        transition: all 0.3s;

        .icon {
          font-size: 0.8em;
          vertical-align: middle;
          margin-right: 0.02em;
        }
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    flex-grow: 0;

    a {
      display: flex;
      padding: 0.9375em 1.25em;
      flex-shrink: 0;
      flex-grow: 0;
      margin: 0;
      align-items: center;
      gap: 0.5rem;
      font-weight: bold;
      text-decoration: none;
      font-size: 0.9em;
      border: 0.125em solid transparent;
      background-color: transparent;
      border-radius: 3.125em;
      transition: all 0.3s;
    }
  }

  &:hover,
  &:focus-visible {
    background-color: var(--color-surface-hover);

    .info {
      gap: 0.3em;

      .name {
        font-size: 0.95em;
      }

      .description {
        .description-text {
          font-size: 0.75em;
        }

        .link-text {
          visibility: visible;
          opacity: 1;
          font-size: 0.85em;
          filter: blur(0);
          max-height: 0.85em;
        }
      }

    }

    .actions {
      a {
        padding: 0.625em 0.9375em;
        margin: 0.3125em 0.3125em;
        background-color: var(--color-surface-active);
        border-color: var(--color-border-subtle);
      }
    }
  }

  &[variant='preview'] {
    font-size: 1em;
    pointer-events: none;
    transition: none;

    * {
      pointer-events: none;
      transition: none !important;
    }

    .actions {
      display: none;
    }
  }
}
</style>
