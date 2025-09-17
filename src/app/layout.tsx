import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AIChatBubble from "../components/AIChatBubble";
import Script from "next/script";
import { TrackerProvider } from "../context/TrackerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEV Challenge Companion",
  description: "Modern workspace for planning and shipping DEV.to challenge submissions",
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
        <Script src="https://cdn.rag.progress.cloud/nuclia-widget.umd.js" strategy="afterInteractive" />
        <TrackerProvider>
          {children}
          <AIChatBubble />
        </TrackerProvider>
      </body>
    </html>
  );
}
