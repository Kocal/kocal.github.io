<template>
  <CommentGitalk v-if="service === 'gitalk'" :options="serviceOptions" />
</template>

<script>
import CommentGitalk from '@theme/components/CommentGitalk.vue';

export default {
  name: "Comment",
  components: { CommentGitalk },
  computed: {
    service() {
      return this.$themeConfig.comment && this.$themeConfig.comment.service || null;
    },
    serviceOptions() {
      const { service, ...options } = this.$themeConfig.comment || {};

      return options;
    },
  },
};
</script>
