<template>
  <main class="main">
    <div class="theme-default-content content__default">
      <div itemscope itemtype="http://schema.org/Blog">
        <article
            v-for="page in pages"
            :key="page.key"
            class="ui-post"
            itemprop="blogPost"
            itemscope
            itemtype="https://schema.org/BlogPosting"
        >
          <meta itemprop="mainEntityOfPage" :content="page.path" />

          <header class="ui-post-title" itemprop="name headline">
            <NavLink :item="{ link: page.path, text: page.title }" :link="page.path" />
          </header>

          <client-only v-if="page.excerpt">
            <!-- eslint-disable vue/no-v-html -->
            <p
                class="ui-post-summary"
                itemprop="description"
                v-html="page.excerpt"
            />
            <!-- eslint-enable vue/no-v-html -->
          </client-only>
          <p v-else class="ui-post-summary" itemprop="description">
            {{ page.frontmatter.summary || page.summary }}
          </p>

          <footer class="ui-post-footer">
            <PostMeta
                :tags="page.frontmatter.tags"
                :date="page.frontmatter.date"
                :lang="page.frontmatter.lang"
            />
          </footer>
        </article>
      </div>

      <Pagination v-if="$pagination.length > 1" />
    </div>
  </main>
</template>

<script>
import dayjs from 'dayjs';
import NavLink from '@theme/components/NavLink.vue';
import PostMeta from '@theme/components/PostMeta.vue';
import { Pagination } from '@vuepress/plugin-blog/lib/client/components';

export default {
  name: "BaseListLayout",
  components: { NavLink, PostMeta, Pagination },
  computed: {
    pages() {
      return this.$pagination.pages;
    },
  },
  methods: {
    resolvePostDate(date) {
      return dayjs
          .utc(date)
          .format(this.$themeConfig.dateFormat || 'ddd MMM DD YYYY');
    },
    resolvePostTags(tags) {
      if (!tags || Array.isArray(tags)) return tags;
      return [tags];
    },
  },
};
</script>

<style scoped lang="stylus">
.ui-post {
  padding-bottom 30px
  margin-bottom 30px
  border-bottom 1px solid $borderColor
}

.ui-post-title a {
  font-size: 22px;
  font-weight: 400;
}

.ui-post-summary {
  font-size: 14px;
  color: rgba(0, 0, 0, .64)
}
</style>
