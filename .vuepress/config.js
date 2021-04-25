module.exports = {
  title: 'Hugo Alliaume',
  description: 'My personal blog',
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-93495564-3'
      }
    ]
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
    dateFormat: 'LL'
    // comment: {
    //   service: "vssue",
    //   prefix: "[Post] ",
    //   owner: "Kocal",
    //   repo: "blog",
    //   clientId: "6ac293ccc1174292305a",
    //   clientSecret: "93224fc793ab8375fb986a294ba27995d41afde9",
    // },
  },
};
