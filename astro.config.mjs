import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://vahleviataraxia.my.id",
  integrations: [tailwind({ applyBaseStyles: false })],
  output: "static",
  compressHTML: true,
});