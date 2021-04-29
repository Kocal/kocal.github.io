module.exports = {
  title: 'Hugo Alliaume',
  description: 'My personal blog',
  head: [
    ['link', { rel: "icon", type: "image/png", href: "/favicon.png"}],
  ],
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-93495564-3',
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
