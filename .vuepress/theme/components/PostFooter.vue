<template>
  <footer class="post-footer">
    <a :href="'https://github.com/Kocal/blog/edit/master/' + $page.relativePath" target="_blank" class="edit-on-github">
      <GithubIcon />
      <span>Edit on GitHub</span>
    </a>
  </footer>
</template>

<script>
import PostTags from '@theme/components/PostTags';
import { GithubIcon } from 'vue-feather-icons';

export default {
  components: {
    PostTags,
    GithubIcon,
  },
};
</script>

<style lang="stylus" scoped>
.post-footer {
  padding: 2rem 0;
}

.edit-on-github {
  display: flex;
  align-items center
  text-decoration: none;

  svg {
    margin-right 5px;
  }
}
</style>
