import dayjs from 'dayjs';
import dayjsPluginUTC from 'dayjs/plugin/utc';
import dayjsPluginLocalizedFormat from 'dayjs/plugin/localizedFormat';

export default ({ Vue, options, router, siteData }) => {
  dayjs.extend(dayjsPluginUTC);
  dayjs.extend(dayjsPluginLocalizedFormat);

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
