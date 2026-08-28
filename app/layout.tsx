import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
    title: "סרטיפי",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FEF6F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      style={{ colorScheme: "light" }}
    >
      <body className="h-full bg-[#FEF6F2] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
