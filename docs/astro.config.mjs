import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import mermaid from "astro-mermaid";
import starlightLinksValidator from "starlight-links-validator";

const REPO = "https://github.com/Aziguy/fleaMarketOnline";

export default defineConfig({
  site: "https://aziguy.github.io",
  base: "/fleaMarketOnline",
  integrations: [
    mermaid({ theme: "neutral", autoTheme: true }),
    starlight({
      title: "Mfoundi Mall",
      description:
        "Documentation de la plateforme en ligne des boutiques du Mfoundi Mall, Yaoundé.",
      logo: { src: "./src/assets/logo.svg" },
      favicon: "/favicon.svg",
      defaultLocale: "root",
      locales: { root: { label: "Français", lang: "fr" } },
      social: [{ icon: "github", label: "GitHub", href: REPO }],
      editLink: { baseUrl: `${REPO}/edit/master/docs/` },
      lastUpdated: true,
      customCss: ["./src/styles/custom.css"],
      plugins: [starlightLinksValidator()],
      sidebar: [
        { label: "Démarrer", items: [{ slug: "presentation" }, { slug: "demo" }] },
        { label: "Guides utilisateur", items: [{ autogenerate: { directory: "guides" } }] },
        { label: "Développeurs", items: [{ autogenerate: { directory: "developpeur" } }] },
        { label: "Projet", items: [{ slug: "contribuer" }, { slug: "securite" }] },
      ],
    }),
  ],
});
