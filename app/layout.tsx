import type { Metadata } from 'next';
import './globals.css';
import '../css/style.css';

export const metadata: Metadata = {
  title: "Save & Smile | Pakistan's #1 Wholesale Online Portal",
  description: "Shop Wholesale Online at Save & Smile. Pakistan's largest direct-to-retailer wholesale portal with cash on delivery, bulk discounts & 24/7 support.",
  icons: {
    icon: '/images/save-and-smile-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
