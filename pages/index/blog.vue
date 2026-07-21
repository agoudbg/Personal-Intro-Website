<script lang="ts" setup>
const BLOG_URL = 'https://blog.agou.im/';

const { articles, errorMessage, isLoading, refresh } = useBlogArticles();
</script>

<template>
  <NuxtLayout name="detail" page-title="博客">
    <template #header-actions>
      <a class="blog-link" :href="BLOG_URL" target="_blank" rel="noopener noreferrer">
        <span>访问</span>
        <Icon name="material-symbols:arrow-outward-rounded" />
      </a>
    </template>

    <section class="blog-content">
      <div v-if="isLoading" class="status">正在加载博客文章…</div>
      <div v-else-if="errorMessage" class="status error">
        <p>博客文章加载失败</p>
        <button type="button" @click="refresh()">重试</button>
      </div>
      <div v-else-if="articles.length === 0" class="status">暂无博客文章</div>
      <div v-else class="article-list">
        <a v-for="article in articles" :key="article.id" class="article" :href="article.link" target="_blank"
          rel="noopener noreferrer">
          <h2>{{ article.title }}</h2>
          <p>{{ article.description }}</p>
        </a>
      </div>
    </section>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.blog-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 600;
  transition: color 0.2s;

  &:hover {
    color: var(--color-text-tertiary);
  }

  :deep(svg) {
    font-size: 18px;
  }
}

.blog-content {
  padding: 0 10px 50px;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.article {
  display: block;
  padding: 16px 18px;
  color: var(--color-text-primary);
  border-radius: 18px;
  transition: background-color 0.2s;

  &:hover,
  &:focus-visible {
    background-color: var(--color-surface-hover);
  }

  h2 {
    margin-bottom: 8px;
    font-size: 19px;
    line-height: 1.4;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.65;
  }
}

.status {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--color-text-secondary);
  text-align: center;
}

.status.error button {
  padding: 8px 16px;
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
  border: 1px solid var(--color-border-subtle);
  border-radius: 999px;
  cursor: pointer;
}
</style>
