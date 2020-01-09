<template>
  <div class="post-tags">
    <PostTag v-for="tag in tags" :tag="tag" />
  </div>
</template>

<script>
import PostTag from '@theme/components/PostTag.vue';

export default {
  name: 'PostTags',
  components: {
    PostTag,
  },
  props: {
    tags: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped lang="stylus">
.post-tags
  display: flex
</style>
