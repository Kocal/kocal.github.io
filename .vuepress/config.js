module.exports = {
  title: 'Hugo Alliaume',
  description: 'My personal blog',
  plugins: [
    '@vuepress/plugin-nprogress',
    ['@vuepress/medium-zoom', true],
    [
      '@vuepress/blog',
      {
        directories: [
          {
            id: 'post',
            dirname: '_posts',
            itemPermalink: '/:year/:month/:day/:slug',
            pagination: {
              lengthPerPage: 5,
            },
          },
        ],
        frontmatters: [
          {
            id: 'tag',
            keys: ['tag', 'tags'],
            path: '/tag/',
            // layout: 'Tag',  defaults to `FrontmatterKey.vue`
            frontmatter: { title: 'Tag' },
            pagination: {
              lengthPerPage: 5,
            },
          },
        ],
        sitemap: {
          hostname: 'https://hugo.alliau.me',
        },
      },
    ],
    'seo',
    ['social-share', {
      networks: ['twitter', 'facebook', 'reddit'],
      twitterUser: 'HugoAlliaume',
    }]
  ],
  themeConfig: {
    repo: 'Kocal/blog',
    editLinks: true,
    lastConfig: 'Last updated',
    nav: [
      { text: 'Tags', link: '/tag/' },
      { text: 'Twitter', link: 'https://twitter.com/HugoAlliaume' },
    ],
  },
};
