"use client";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import { button as buttonStyles, link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useContext, useEffect, useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Link as NextLink } from "@/i18n/routing";
import logo from "@/assets/logo.png";
import LanguageSwitcher from "@/components/language-switcher";
import ProfileDropdown from "@/components/profile-dropdown";
import { UserContext } from "@/context/user-context";

export const Navbar = () => {
  const pathname = usePathname();
  const { user } = useContext(UserContext);

  const t = useTranslations("Navigation");

  const [navItems, setNavItems] = useState<
    {
      label: string;
      href: string;
    }[]
  >([]);

  useEffect(() => {
    if (user?.role === "admin") {
      setNavItems(siteConfig?.adminItems);

      return;
    }
    if (user?.role === "user") {
      setNavItems(siteConfig?.userItems);

      return;
    } else {
      setNavItems(siteConfig?.navItems);

      return;
    }
  }, [user]);

  return (
    <HeroUINavbar
      className="bg-transparent dark:bg-transparent"
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center text-foreground"
            href="/"
          >
            <img
              alt="logo"
              className="h-6 w-6 sm:h-10 sm:w-10"
              src={logo.src}
            />
            <p className="text-sm sm:text-medium font-bold text-inherit">
              VaxSupport
            </p>
          </Link>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  item.href === pathname && "text-secondary font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {t(item.label)}
              </NextLink>
            </NavbarItem>
          ))}
          <Link
            isExternal
            className="text-foreground"
            href="http://www.vaccinesupport.co"
          >
            VaxSupport
          </Link>
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 lg:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden lg:flex gap-2">
          <LanguageSwitcher />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex gap-2">
          {user ? (
            <ProfileDropdown />
          ) : (
            <NextLink
              className={clsx(
                buttonStyles({
                  radius: "full",
                  variant: "shadow",
                }),
                "text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out",
              )}
              href="/sign-in"
            >
              {t("signIn")}
            </NextLink>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="lg:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch isSmall />
        {user ? (
          <ProfileDropdown />
        ) : (
          <NextLink
            className={clsx(
              buttonStyles({
                radius: "full",
                variant: "shadow",
                size: "sm",
              }),
              "text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out",
            )}
            href="/sign-in"
          >
            {t("signIn")}
          </NextLink>
        )}
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {/*{searchInput}*/}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <NextLink
                color={item.href === pathname ? "secondary" : "foreground"}
                href={item.href}
              >
                {t(item.label)}
              </NextLink>
            </NavbarMenuItem>
          ))}
          <Link
            isExternal
            className="text-foreground"
            href="http://www.vaccinesupport.co"
          >
            VaxSupport
          </Link>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
