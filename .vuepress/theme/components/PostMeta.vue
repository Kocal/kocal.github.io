<template>
  <div class="ui-post-metas">
    <div v-if="date" class="ui-post-meta ui-post-date">
      <ClockIcon size="16" class="ui-post-meta-icon" />
      <time pubdate itemprop="datePublished" :datetime="date">
        {{ resolvedDate }}
      </time>
    </div>

    <div v-if="tags" class="ui-post-meta ui-post-tag" itemprop="keywords">
      <TagIcon size="16" class="ui-post-meta-icon" />
      <div>
        <router-link
            v-for="tag in resolvedTags"
            :key="tag"
            :to="'/tag/' + tag"
        >
          {{ tag }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import { ClockIcon, TagIcon } from 'vue-feather-icons';
import PostTag from '@theme/components/PostTag.vue';

export default {
  name: 'PostMeta',
  components: { TagIcon, ClockIcon, PostTag },
  props: {
    tags: {
      type: [Array, String],
    },
    date: {
      type: String,
    },
    lang: {
      type: String,
    },
  },
  computed: {
    resolvedDate() {
      return dayjs
          .utc(this.date)
          .locale(this.lang)
          .format(this.$themeConfig.dateFormat || 'ddd MMM DD YYYY');
    },
    resolvedTags() {
      if (!this.tags || Array.isArray(this.tags)) return this.tags;
      return [this.tags];
    },
  },
};
</script>

<style lang="stylus">
.ui-post-metas {
  display: flex;
  font-size: 14px
}

.ui-post-meta {
  display: flex;
  margin-right: 16px;
}

.ui-post-meta-icon {
  margin-right: 4px;
}
</style>
