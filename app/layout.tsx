import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Save & Smile - Pakistan Online Wholesale Shopping Portal',
  description: 'Shop top quality trending household gadgets, kitchen accessories, smart watches & wholesale essentials at unbeatable factory prices across Pakistan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="icon" href="/images/save-and-smile-logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
