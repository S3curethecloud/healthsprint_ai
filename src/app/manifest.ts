import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HealthSprint AI",
    short_name: "HealthSprint",
    description:
      "A 45-day nutrition, calorie, hydration, activity, and progress tracker.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#07111f",
    theme_color: "#07111f",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/healthsprint-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/healthsprint-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
