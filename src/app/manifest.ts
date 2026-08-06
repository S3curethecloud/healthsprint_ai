import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "HealthSprint AI",
    short_name: "HealthSprint",
    description:
      "A 45-day nutrition, calorie, hydration, activity, and progress tracker.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait-primary",
    background_color: "#07111f",
    theme_color: "#07111f",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/healthsprint-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/healthsprint-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/healthsprint-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/healthsprint-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "HealthSprint AI mobile dashboard",
      },
      {
        src: "/screenshots/healthsprint-desktop.png",
        sizes: "1440x900",
        type: "image/png",
        form_factor: "wide",
        label: "HealthSprint AI desktop dashboard",
      },
    ],
  };
}
