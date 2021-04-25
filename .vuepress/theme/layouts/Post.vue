<template>
  <Layout>
    <template #default="{sidebarItems}">
      <main class="page">
        <article class="theme-default-content" itemscope itemtype="https://schema.org/BlogPosting">
          <header>
            <h1 itemprop="name headline">
              {{ $frontmatter.title }}
              <Badge v-for="badge in ($frontmatter.badges || [])" :type="badge.type" :text="badge.text"/>
            </h1>
            <PostMeta
                :tags="$frontmatter.tags"
                :author="$frontmatter.author"
                :date="$frontmatter.date"
                :location="$frontmatter.location"
            />
          </header>

          <Content class="theme-default-content" itemprop="articleBody" style="padding: 0" />

          <footer>
            <PageEdit />
          </footer>
        </article>
      </main>
    </template>
  </Layout>
</template>

<script>
import Page from '@theme/components/Page.vue';
import PageEdit from '@theme/components/PageEdit.vue';
import PostMeta from '@theme/components/PostMeta.vue';
import SidebarLinks from '@theme/components/SidebarLinks.vue';

export default {
  name: "Post",
  components: { PostMeta, Page, PageEdit, SidebarLinks },
};
</script>
