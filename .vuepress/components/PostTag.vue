<template>
  <span class="post-tag">
    <router-link :to="'/tag/' + tag">
      #{{ tag }}
    </router-link>
  </span>
</template>

<script>
export default {
  name: 'PostTag',
  props: {
    tag: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped lang="stylus">

.post-tag
  margin-right: 4px

  a
    padding: 3px 8px
    border-radius: 25px
    background-color: $accentColor
    color: #fff
    font-size: .8rem
    text-decoration: none !important

    &:hover
      background-color: darken($accentColor, 10%)
</style>
