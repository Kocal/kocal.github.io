<template>
  <div class="post-tag">
    <router-link :to="'/tag/' + tag">
      #{{ tag }}
    </router-link>
  </div>
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
