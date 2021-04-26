<template>
  <Layout>
    <main class="page">
      <article class="theme-default-content" itemscope itemtype="https://schema.org/BlogPosting">
        <header>
          <h1 itemprop="name headline">
            {{ $frontmatter.title }}
            <Badge v-for="badge in ($frontmatter.badges || [])" :type="badge.type" :text="badge.text" />
          </h1>
          <PostMeta
              :tags="$frontmatter.tags"
              :author="$frontmatter.author"
              :date="$frontmatter.date"
              :location="$frontmatter.location"
          />

          <SocialShare style="padding: 10px 0" />
        </header>

        <Content class="theme-default-content" itemprop="articleBody" style="padding: 0" />

        <footer>
          <PageEdit />
          <hr>
          <a :href="commentUrl" class="btn-comment" target="_blank" rel="noopener noreferrer">
            Leave a comment!
            <ExternalLinkIcon style="margin-left: 5px"/>
          </a>
        </footer>
      </article>
    </main>
  </Layout>
</template>

<script>
import Page from '@theme/components/Page.vue';
import PageEdit from '@theme/components/PageEdit.vue';
import PostMeta from '@theme/components/PostMeta.vue';
import SidebarLinks from '@theme/components/SidebarLinks.vue';
import {ExternalLinkIcon} from 'vue-feather-icons'

export default {
  name: "Post",
  components: { PostMeta, Page, PageEdit, SidebarLinks, ExternalLinkIcon },
  computed: {
    commentUrl() {
      return `https://github.com/${this.$themeConfig.repo}/issues?q=${encodeURIComponent('is:issue is:open ' + this.$frontmatter.title)}`;
    },
  },
};
</script>

<style scoped lang="stylus">
.btn-comment {
  display flex;
  align-items center
  justify-content center
  padding: 12px;
  font-size 20px;
  background-color $accentColor;
  color #fff;
  border-radius: 5px;
  text-decoration none !important;

  &:hover {
    background-color: darken($accentColor, 10%);
  }
}
</style>
