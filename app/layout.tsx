import './globals.css';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Dynamic Metadata Engine (Site Title, Description, Favicon, OG Tags)
export async function generateMetadata(): Promise<Metadata> {
  let title = 'Save & Smile - Pakistan Online Wholesale Shopping Portal';
  let description = 'Shop top quality trending household gadgets, kitchen accessories, smart watches & wholesale essentials at unbeatable factory prices across Pakistan.';
  let icon = '/images/save-and-smile-logo.png';
  let ogImage = '/images/save-and-smile-logo.png';
  let ogTitle = title;
  let ogDescription = description;

  try {
    const seoFile = path.join(process.cwd(), 'data', 'seo_settings.json');
    if (fs.existsSync(seoFile)) {
      const seoData = JSON.parse(fs.readFileSync(seoFile, 'utf8'));
      if (seoData.default_title) title = seoData.default_title;
      if (seoData.default_description) description = seoData.default_description;
      if (seoData.default_social_title) ogTitle = seoData.default_social_title;
      if (seoData.default_social_desc) ogDescription = seoData.default_social_desc;
      if (seoData.default_og_image) ogImage = seoData.default_og_image;
      if (seoData.logo_url) icon = seoData.logo_url;
    }
  } catch (e) {}

  return {
    title,
    description,
    icons: {
      icon,
      shortcut: icon,
      apple: icon
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage
        }
      ]
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
