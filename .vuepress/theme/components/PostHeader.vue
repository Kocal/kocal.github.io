<template>
  <header>
    <h1>{{ $page.frontmatter.title }}</h1>
    <PostTags :tags="$page.frontmatter.tags" />
  </header>
</template>

<script>
import PostTags from '@theme/components/PostTags';

export default {
  components: {
    PostTags,
  },
};
</script>
