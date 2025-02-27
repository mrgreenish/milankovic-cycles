export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://milankovic-cycles.vercel.app/sitemap.xml',
  };
} 