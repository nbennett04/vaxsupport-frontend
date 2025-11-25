export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "VaxSupport",
  description: "VaxSupport",
  adminItems: [
    {
      label: "home",
      href: "/",
    },
    {
      label: "chat",
      href: "/chat",
    },
    {
      label: "admin",
      href: "/admin/users",
    },
  ],
  userItems: [
    {
      label: "home",
      href: "/",
    },
    {
      label: "chat",
      href: "/chat",
    },
  ],
  navItems: [
    {
      label: "home",
      href: "/",
    },
  ],
  links: {
    github: "https://github.com/frontio-ai/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
