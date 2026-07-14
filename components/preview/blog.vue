<script lang="ts" setup>
const props = withDefaults(defineProps<{ loading?: boolean }>(), {
  loading: false,
});

const { articles, errorMessage, isLoading } = useBlogArticles();

const recentArticles = computed(() => articles.value.slice(0, 3));
</script>

<template>
  <NuxtLayout name="preview-card" :page-id="'blog'" page-title="博客" :icon-name="'blog'" :loading="props.loading">
    <div class="blog-preview">
      <div v-if="isLoading" class="status">正在加载最近文章…</div>
      <div v-else-if="errorMessage" class="status error">暂时无法加载博客文章</div>
      <div v-else-if="recentArticles.length === 0" class="status">暂无博客文章</div>
      <ol v-else class="article-list">
        <li v-for="article in recentArticles" :key="article.id" class="article">
          <p class="article-excerpt">
            <span class="article-title">{{ article.title }}</span>
            <template v-if="article.description">
              <br>
              <span class="article-description">{{ article.description }}</span>
            </template>
          </p>
        </li>
      </ol>
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.blog-preview {
  width: 100%;
  height: 100%;
  padding: 0 0.5em 0.5em;
}

.article-list {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  list-style: none;
  text-align: left;
}

.article {
  min-height: 0;
  display: flex;
  align-items: center;
  padding: 0.35em 0.45em;
  overflow: hidden;

  &+.article {
    border-top: 1px solid var(--color-border-subtle);
  }
}

.article-excerpt {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.93em;
  line-height: 1.35;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
}

.article-title {
  font-size: 1.06em;
  font-weight: 700;
  color: var(--color-text-primary);
}

.article-description {
  color: var(--color-text-secondary);
}

.status {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1em;
  color: var(--color-text-secondary);
  text-align: center;
}

.status.error {
  color: var(--color-text-tertiary);
}
</style>
