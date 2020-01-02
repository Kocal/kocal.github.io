<template>
        <span class="post-tag">
        <a :href="'/tag/' + tag">
          #{{ tag }}
        </a>
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
    background-color: $accentColor
    border-radius: 25px
    color: #fff
    font-size: .8rem
    padding: 3px 8px

    &:hover
      background-color: darken($accentColor, 10%)
</style>
