import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const googleSans = localFont({
  src: [
    {
      path: "./fonts/GoogleSans-Variable.ttf",
      style: "normal",
      weight: "400 700",
    },
    {
      path: "./fonts/GoogleSans-Italic-Variable.ttf",
      style: "italic",
      weight: "400 700",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "פעילות",
  description: "מעקב אחר מסמכים ואישורים של עובדים",
  applicationName: "Certify",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "פעילות",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${googleSans.variable} ${googleSans.className} h-full`}
    >
      <body className="h-full overflow-hidden font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
