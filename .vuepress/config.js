module.exports = {
  title: 'Hugo Alliaume',
  description: 'My personal blog',
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-93495564-3',
      },
    ],
    '@vuepress/pwa',
    [
      '@vssue/vuepress-plugin-vssue',
      {
        platform: 'github',
        owner: "Kocal",
        repo: "blog",
        clientId: "114b1045fc6a5b2d1338",
        clientSecret: "f6d97c5b707e0d2fb96446f837bad654d1dab5f7",
      },
    ],
  ],
  themeConfig: {
    repo: 'Kocal/blog',
    docsBranch: 'main',
    editLinks: true,
    nav: [
      { text: 'Tags', link: '/tag/' },
      { text: 'GitHub', link: 'https://github.com/Kocal' },
      { text: 'Twitter', link: 'https://twitter.com/HugoAlliaume' },
    ],
    smoothScroll: true,
    sidebar: 'auto',
    dateFormat: 'LL',
  },
};
