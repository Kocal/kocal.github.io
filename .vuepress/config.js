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
          },
        ],
        sitemap: {
          hostname: 'https://hugo.alliau.me',
          exclude: ['/404.html', '/post/']
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
      { text: 'Tags', link: '/tags/' },
      { text: 'Twitter', link: 'https://twitter.com/HugoAlliaume' },
    ],
  },
};
