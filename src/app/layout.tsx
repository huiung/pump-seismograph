import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pump Seismograph - Memecoin Earthquake Monitor",
  description:
    "Real-time seismograph visualization of Pump.fun token launches. Detect foreshock patterns before the next big memecoin.",
  openGraph: {
    title: "Pump Seismograph",
    description:
      "Real-time seismograph visualization of Pump.fun token launches. Detect foreshock patterns before the next big memecoin.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pump Seismograph",
    description:
      "Real-time seismograph visualization of Pump.fun token launches.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-gray-200`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
