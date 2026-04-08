import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMX Pharma Marketplace Exchange",
  description: "Pakistan's first compliance-linked B2B pharmaceutical export platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
