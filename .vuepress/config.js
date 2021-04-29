module.exports = {
  title: 'Hugo Alliaume',
  description: 'My personal blog',
  head: [
    ['link', { rel: "icon", type: "image/png", href: "/favicon.png" }],
    ['script', {
      async: true,
      src: 'https://www.googletagmanager.com/gtag/js?id=G-Z8KN175TJZ',
    }],
    ['script', {}, [`
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){dataLayer.push(arguments);}
      gtag('js', new Date());
    
      gtag('config', 'G-Z8KN175TJZ');`,
    ]],
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
