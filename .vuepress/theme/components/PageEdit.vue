<template>
  <footer class="page-edit">
    <div
        v-if="editLink"
        class="edit-link"
    >
      <a
          :href="editLink"
          target="_blank"
          rel="noopener noreferrer"
      >{{ editLinkText }}</a>
      <OutboundLink />
    </div>

    <div
        v-if="lastUpdated"
        class="last-updated"
    >
      <span class="prefix">{{ lastUpdatedText }}:</span>
      <time class="time">{{ lastUpdated }}</time>
    </div>
  </footer>
</template>

<script>
import PageEdit from '@parent-theme/components/PageEdit.vue';

export default {
  extends: PageEdit,
  computed: {
    // See https://github.com/lorisleiva/vuepress-plugin-seo/issues/9#issuecomment-832951595
    lastUpdated() {
      return new Date(this.$page.lastUpdated).toLocaleString(this.$lang)
    }
  }
};
</script>
