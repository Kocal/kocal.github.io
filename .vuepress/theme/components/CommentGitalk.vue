<template>
  <div/>
</template>

<script>
import 'gitalk/dist/gitalk.css';
import Gitalk from 'gitalk'

export default {
  name: "CommentGitalk",
  props: {
    options: {
      type: Object,
    },
  },
  mounted() {
    this.gitalk = new Gitalk(this.options);
    this.gitalk.render(this.$el);
  }
};
</script>
