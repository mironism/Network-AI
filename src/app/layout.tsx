import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agary",
  description: "Agary – AI-powered networking CRM for enriched contacts and smart search.",
  openGraph: {
    title: "Agary",
    description: "AI-powered networking CRM for enriched contacts and smart search.",
    url: "https://agary.app",
    siteName: "Agary",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agary",
    description: "AI-powered networking CRM for enriched contacts and smart search.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
