<template>
  <article class="post">
    <header class="post-header">
      <router-link :to="post.path">{{ post.title }}</router-link>
    </header>

    <PostTags :tags="post.frontmatter.tags || []" />

    <footer class="post-footer">
      Posted on
      <time :datetime="post.createdAt | date('Y-MM-dd')" class="post-createdAt">{{ post.createdAt | date('PPPP') }}</time>
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
    displayTags: {
      type: Boolean,
      default: true
    }
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
