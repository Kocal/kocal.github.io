<template>
  <div class="post-list">
    <PostListItem v-for="post in postsSortedByCreatedAtDesc" :post="post" />
  </div>
</template>

<script>
export default {
  name: 'PostList',
  props: {
    posts: {
      type: Array,
      required: true,
    },
  },
  computed: {
    postsSortedByCreatedAtDesc() {
      return [...this.$posts].sort((a, b) => {
        return b.createdAt - a.createdAt;
      });
    },
  },
};
</script>
