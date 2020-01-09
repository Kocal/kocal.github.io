<template>
  <div id="vuepress-theme-blog__post-layout">
    <div class="vuepress-blog-theme-content">
      <PostHeader />
      <Content />
      <PostFooter />
      <Newsletter v-if="$service.email.enabled" />
      <hr />
      <Comment />
    </div>
    <Toc />
  </div>
</template>

<script>
import PostHeader from '@theme/components/PostHeader.vue'
import PostFooter from '@theme/components/PostFooter.vue'
import Toc from '@theme/components/Toc.vue'
import { Comment } from '@vuepress/plugin-blog/lib/client/components'

export default {
  components: {
    PostHeader,
    PostFooter,
    Toc,
    Comment,
    Newsletter: () => import('@theme/components/Newsletter.vue'),
  },
}
</script>
