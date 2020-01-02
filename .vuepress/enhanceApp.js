import { format as formatDate } from 'date-fns';

export default ({ Vue, options, router, siteData }) => {
  Vue.filter('date', (date, format) => {
    return formatDate(date, format);
  });
}
