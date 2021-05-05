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
      comment: {
        service: 'vssue',
        platform: 'github',
        owner: "Kocal",
        repo: "blog",
        clientId: "114b1045fc6a5b2d1338",
        clientSecret: process.env.VSSUE_CLIENT_SECRET || '<secret key>',
      }
    }],
    ['@vuepress/medium-zoom', true],
    ['@vuepress/last-updated', {
      // See https://github.com/lorisleiva/vuepress-plugin-seo/issues/9#issuecomment-832951595
      transformer(timestamp) {
        return timestamp;
      }
    }],
    'seo',
  ],

  /**
   * Generate summary.
   */
  extendPageData(pageCtx) {
    if (pageCtx.path === '/') {
      pageCtx.frontmatter.home = true;
      pageCtx.frontmatter.title = 'Homepage';
      pageCtx.frontmatter.layout = 'Homepage';
    } else if (pageCtx.path.substr(0, 5) === '/tag/') {
      pageCtx.frontmatter.sidebar = false;
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

    pageCtx.frontmatter.lang = pageCtx.frontmatter.lang || 'en';
  },
};
