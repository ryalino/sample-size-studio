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
  title: "StudySize Studio",
  description:
    "Interactive sample size calculators for clinical and research study designs.",
  openGraph: {
    title: "StudySize Studio",
    description:
      "Live sample size planning with sliders, exact inputs, assumptions, citations, PDFs, and saved scenarios.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "StudySize Studio",
    description:
      "Interactive sample size calculators for researchers and clinicians.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
