const removeMarkdown = require('remove-markdown');

module.exports = {
  extend: '@vuepress/theme-default',
  plugins: [
    ['@vuepress/plugin-blog', {
      directories: [
        {
          id: 'post',
          dirname: '_posts',
          path: '/',
        },
      ],
      frontmatters: [
        {
          id: 'tag',
          keys: ['tags'],
          path: '/tag/',
          layout: 'Tags',
          scopeLayout: 'Tag',
        },
      ],
      globalPagination: {
        lengthPerPage: 5,
      },
      sitemap: {
        hostname: 'https://hugo.alliau.me',
      },
      feed: {
        canonical_base: 'https://hugo.alliau.me',
      },
    }],
    '@vuepress/plugin-nprogress',
    ['@vuepress/medium-zoom', true],
    'seo',
    ['social-share', {
      networks: ['twitter', 'facebook', 'reddit'],
      twitterUser: 'HugoAlliaume',
    }],
  ],

  /**
   * Generate summary.
   */
  extendPageData(pageCtx) {
    if (pageCtx.path === '/') {
      pageCtx.frontmatter.title = 'Homepage';
      pageCtx.frontmatter.layout = 'Homepage';
    }

    const strippedContent = pageCtx._strippedContent;
    if (!strippedContent) {
      return;
    }
    pageCtx.summary =
      removeMarkdown(
        strippedContent
          .trim()
          .replace(/^#+\s+(.*)/, '')
          .slice(0, 150),
      ) + ' ...';
    pageCtx.frontmatter.description = pageCtx.summary;

    if (pageCtx.frontmatter.summary) {
      pageCtx.frontmatter.description = pageCtx.frontmatter.summary;
    }
  },
};
