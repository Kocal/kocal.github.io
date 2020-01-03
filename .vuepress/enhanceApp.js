import { format as formatDate } from 'date-fns';

export default ({ Vue, options, router, siteData }) => {
  Vue.filter('date', (date, format) => {
    return formatDate(date, format);
  });

  Vue.mixin({
    computed: {
      $posts() {
        return this.$site.pages
          .filter(page => page.id === 'post')
          .map(post => {
            const [, year, month, day] = post.path.split('/');

            post.createdAt = new Date(year, month - 1, day);

            return post;
          });
      },
    },
  });
}
