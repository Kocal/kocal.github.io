<template>
  <article class="post">
    <header class="post-header">
      <a :href="post.path">{{ post.title }}</a>
    </header>

    <PostTags v-if="post.frontmatter.tag.length > 0" :tags="post.frontmatter.tag" />

    <footer class="post-footer">
      Posted on
      <time :datetime="createdAt | date('Y-MM-dd')" class="post-createdAt">{{ createdAt | date('PPPP') }}</time>
    </footer>
  </article>
</template>

<script>
export default {
  name: 'PostListItem',
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      createdAt: null,
    };
  },
  created() {
    const [, year, month, day] = this.post.path.split('/');

    this.createdAt = new Date(year, month - 1, day);
  },
};
</script>

<style scoped lang="stylus">
.post
  padding: .8em 0
  border-bottom: 1px solid $borderColor

  &:last-child
    border-bottom: 0

.post-header
  font-size: 1.2rem
  margin-bottom: .8em

.post-footer
  margin-top: .8em
  font-style: italic
</style>
