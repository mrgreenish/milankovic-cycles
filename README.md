This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SEO Implementation

This project includes comprehensive SEO optimization for better search engine visibility and social sharing:

### Implemented SEO Features

- **Metadata Configuration**: Enhanced title, description, and keywords in `layout.js`
- **Open Graph Protocol**: Custom tags for better sharing on Facebook, LinkedIn, etc.
- **Twitter Cards**: Optimized sharing experience on Twitter
- **Sitemap**: Automatic sitemap generation via `sitemap.js`
- **Robots.txt**: Search engine crawling instructions via `robots.js`
- **Web App Manifest**: PWA capabilities via `manifest.json`
- **Structured Data**: Semantically rich content for search engines

### How to Maintain SEO

1. **Update Metadata**: Keep the metadata in `src/app/layout.js` current with your content
2. **Add New Routes**: When adding new pages, update the sitemap in `src/app/sitemap.js`
3. **Images Optimization**: Maintain proper image sizes for OG and Twitter cards
4. **Monitor Performance**: Use tools like Lighthouse to check SEO performance

### Apple Icon Generation

To generate the apple-icon.png for iOS devices:

1. Install Sharp:
   ```bash
   npm install sharp --save-dev
   ```

2. Run the generation script:
   ```bash
   node scripts/generate-apple-icon.js
   ```

This will create the properly sized apple-icon.png in your public directory.
