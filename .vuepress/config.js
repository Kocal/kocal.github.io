module.exports = {
  title: 'Hugo Alliaume',
  description: 'My personal blog',
  plugins: [
    '@vuepress/plugin-nprogress',
    ['@vuepress/medium-zoom', true],
    'seo',
    ['social-share', {
      networks: ['twitter', 'facebook', 'reddit'],
      twitterUser: 'HugoAlliaume',
    }],
  ],
  theme: '@vuepress/blog',
  themeConfig: {
    repo: 'Kocal/blog',
    editLinks: true,
    lastConfig: 'Last updated',
    nav: [
      { text: 'Tags', link: '/tag/' },
      { text: 'GitHub', link: 'https://github.com/Kocal' },
      { text: 'Twitter', link: 'https://twitter.com/HugoAlliaume' },
    ],
    modifyBlogPluginOptions(blogPluginOptions) {
      return {
        ...blogPluginOptions,
        sitemap: {
          ...blogPluginOptions.sitemap,
          hostname: 'https://hugo.alliau.me',
        },
      };
    },
  },
};
