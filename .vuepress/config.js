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
    nav: [
      { text: 'Tags', link: '/tag/' },
      { text: 'GitHub', link: 'https://github.com/Kocal' },
      { text: 'Twitter', link: 'https://twitter.com/HugoAlliaume' },
    ],
    modifyBlogPluginOptions(blogPluginOptions) {
      const sitemap = {
        ...blogPluginOptions.sitemap,
        hostname: 'https://hugo.alliau.me',
      };

      const comment = {
        service: "vssue",
        autoCreateIssue: true,
        prefix: "[Post] ",
        owner: "Kocal",
        repo: "blog",
        clientId: "6ac293ccc1174292305a",
        clientSecret: "93224fc793ab8375fb986a294ba27995d41afde9",
      };

      return {
        ...blogPluginOptions,
        sitemap,
        comment,
      };
    },
  },
};
