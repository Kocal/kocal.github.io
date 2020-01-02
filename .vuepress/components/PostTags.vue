<template>
  <div class="post-tags">
    <PostTag v-for="tag in tags" :tag="tag" />
  </div>
</template>

<script>
export default {
  name: 'PostTags',
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
