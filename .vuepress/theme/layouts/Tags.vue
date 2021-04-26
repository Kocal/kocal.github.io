<template>
  <Layout>
    <main class="main">
      <section class="theme-default-content">
        <h1>Tags</h1>

        <div class="tags">
          <router-link v-for="tag in $frontmatterKey.list" :to="tag.path" class="tag">
            {{ tag.name }} ({{ tag.pages.length }})
          </router-link>
        </div>
      </section>
    </main>
  </Layout>
</template>

<style scoped lang="stylus">
.tag {
  border: 1px solid $accentColor;
  text-decoration: none !important;
  padding: 8px 12px;
  margin-right: 10px;
  margin-bottom: 10px;
  border-radius: 20px;

  &:hover {
    background-color: $accentColor;
    color: #fff;
  }
}
</style>
