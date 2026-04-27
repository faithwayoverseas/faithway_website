import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import CustomCursor from "@/components/ui/CustomCursor";
import PublicLayoutWrapper from "@/components/layout/PublicLayoutWrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://faithwayoverseas.com'),
  title: "Faithway Overseas | Elite Immigration & Global Residency",
  description: "Faithway Overseas is a premium immigration consultancy providing elite visa services, citizenship by investment, and international career planning with absolute integrity.",
  keywords: ["immigration", "visa", "PR", "citizenship by investment", "study abroad", "Canada PR", "Australia PR", "UK visa", "luxury consultancy"],
  openGraph: {
    title: "Faithway Overseas | Elite Immigration & Global Residency",
    description: "Your gateway to global opportunities with premium immigration services.",
    url: "https://faithwayoverseas.com",
    siteName: "Faithway Overseas",
    images: [
      {
        url: "/og-image.png", // Placeholder
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-midnight text-white selection:bg-gold/30">
        <SmoothScroll>
          <CustomCursor />
          <PublicLayoutWrapper>
            {children}
          </PublicLayoutWrapper>
        </SmoothScroll>
      </body>
    </html>
  );
}
