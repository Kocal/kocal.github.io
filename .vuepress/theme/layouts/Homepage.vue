<template>
  <Layout>
    <template #default>
      <BaseListLayout v-if="$pagination" />
    </template>
  </Layout>
</template>

<script>
import BaseListLayout from '../components/BaseListLayout';

export default {
  name: "Post",
  components: { BaseListLayout },
};
</script>
