import type { Metadata } from "next";
import { Geist, Geist_Mono, Pinyon_Script, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const pinyonScript = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Let It Go",
  description:
    "Write the words you can't say to the people you can't reach. Nothing is sent. Just let it go.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pinyonScript.variable} ${beVietnam.variable} antialiased`}
      >
        <div className="site-wrapper">{children}</div>
      </body>
    </html>
  );
}
