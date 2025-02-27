export default function sitemap() {
  const baseUrl = 'https://milankovic-cycles.vercel.app';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    // Add more routes here as your application grows
  ];
} 