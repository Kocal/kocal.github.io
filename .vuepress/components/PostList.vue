<template>
  <div class="post-list">
    <PostListItem v-for="post in posts" :post="post" />
  </div>
</template>

<script>
export default {
  name: 'PostList',
  computed: {
    posts() {
      return this.$site.pages.filter(page => page.id === 'post').reverse();
    },
  },
};
</script>
