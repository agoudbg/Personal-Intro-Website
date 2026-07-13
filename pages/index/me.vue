<script lang="ts" setup>
import { aboutContent, contactLinks } from '~/assets/about';
</script>

<template>
  <NuxtLayout name="detail" page-title="关于">
    <section class="about-content">
      <div class="introduction">
        <p>{{ aboutContent.greeting }}</p>
        <p>{{ aboutContent.introduction }}</p>
        <p>
          {{ aboutContent.channelLead }}
          <a :href="aboutContent.channelLink" target="_blank" rel="noopener noreferrer">
            {{ aboutContent.channelHandle }}
          </a>{{ aboutContent.channelTail }}
        </p>
      </div>

      <nav class="contacts" aria-label="联系方式">
        <a v-for="contact in contactLinks" :key="contact.link" class="contact" :href="contact.link" target="_blank"
          rel="noopener noreferrer">
          <img :src="contact.iconUrl" alt="" aria-hidden="true">
          <span>{{ contact.label }}</span>
        </a>
      </nav>
    </section>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.about-content {
  padding: 0 20px 40px;
}

.introduction {
  margin-bottom: 20px;
  font-size: 17px;
  line-height: 1.6;

  a {
    color: #0080ff;
  }
}

.contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.8em;
}

.contact {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: 2.5em;
  margin-bottom: 0.8em;
  overflow: hidden;
  color: var(--page-text-color);
  background-color: var(--dark-10);
  border-radius: 999px;

  img {
    width: 2em;
    height: 2em;
    margin-left: 0.27em;
    object-fit: contain;
    border-radius: 50%;
    flex-shrink: 0;
  }

  span {
    margin: 0 0.9em 0 0.4em;
    overflow: hidden;
    font-size: 1em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
