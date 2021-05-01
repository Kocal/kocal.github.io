<template>
  <nav
      v-if="userLinks.length || repoLink"
      class="nav-links"
  >
    <!-- user links -->
    <div
        v-for="item in userLinks"
        :key="item.link"
        class="nav-item"
    >
      <DropdownLink
          v-if="item.type === 'links'"
          :item="item"
      />
      <NavLink
          v-else
          :item="item"
      />
    </div>

    <!-- RSS link -->
    <div class="nav-item" style="line-height: normal">
      <a href="/rss.xml">
        <RssIcon />
        <span class="sr-only">Flux RSS</span>
      </a>
    </div>
  </nav>
</template>

<script>
import NavLinks from '@parent-theme/components/NavLinks.vue';
import { RssIcon } from 'vue-feather-icons';

export default {
  extends: NavLinks,
  components: { RssIcon },
};
</script>

<style>
.nav-links {
  display: inline-flex;
  align-items: center;
}
</style>
