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
    statusBarStyle: "black-translucent",
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

// Evaluated once at build time; lets us confirm on-device which deploy loaded.
const buildStamp = new Date().toISOString().slice(0, 16).replace("T", " ");

// Temporary on-device diagnostics: paints a red banner with any JS error so we
// can debug failures on real phones where devtools are unavailable.
const errorReporterScript = `(function () {
  function show(msg) {
    try {
      var el = document.getElementById("__err_banner");
      if (!el) {
        el = document.createElement("div");
        el.id = "__err_banner";
        el.style.cssText =
          "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#b91c1c;color:#fff;font:11px/1.5 monospace;padding:8px 12px;direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-all;max-height:45vh;overflow:auto";
        el.textContent = "build ${buildStamp} UTC\\n";
        (document.body || document.documentElement).appendChild(el);
      }
      el.textContent += msg + "\\n";
    } catch (_) {}
  }
  window.addEventListener("error", function (e) {
    show(
      (e.message || "script error") +
        (e.filename ? " @ " + e.filename.split("/").pop() + ":" + e.lineno : "")
    );
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    show("promise: " + ((r && (r.stack || r.message)) || String(r)).slice(0, 400));
  });
  console.log("build ${buildStamp} UTC");
})();`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: errorReporterScript }} />
      </head>
      <body className="h-full bg-[#FEF6F2] font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
