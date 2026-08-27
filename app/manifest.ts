import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Certify",
    short_name: "Certify",
    description: "מעקב אחר מסמכים ואישורים של עובדים",
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "he",
    background_color: "#f5f5f4",
    theme_color: "#0F766E",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
