<template>
  <div>
    <div v-for="(tagProps, tag) in tags" :key="tag">
      <span class="tag-name">{{ tag }}</span>
      <span class="tag-posts-count">({{ tagProps.count }})</span>

      <ul class="tag-posts">
        <li v-for="post in tagProps.posts">
          <span class="post-createdAt">({{ post.createdAt | date('MM/Y') }})</span>
          <router-link :to="post.path" class="post-title">
            {{ post.title }}
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tags: {},
    };
  },
  created() {
    this.$posts.forEach($post => {
      const postTags = $post.frontmatter.tag || $post.frontmatter.tags || [];

      postTags.forEach(postTag => {
        if (!(postTag in this.tags)) {
          this.tags[postTag] = {
            count: 0,
            posts: [],
          };
        }

        this.tags[postTag].count += 1;
        this.tags[postTag].posts.push($post);
      });
    });
  },
};
</script>

<style scoped lang="stylus">
.tag-name
  font-weight: bold
</style>
