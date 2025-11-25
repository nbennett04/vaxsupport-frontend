"use client";
import React from "react";
import { ShieldExclamationIcon, UsersIcon,DocumentTextIcon, CpuChipIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";

const navData = [
  // {
  //   title: "Dashboard",
  //   icon: HomeIcon,
  //   link: "/admin",
  // },
  {
    title: "Users",
    icon: UsersIcon,
    link: "/admin/users",
  },
  {
    title: "Reports",
    icon: ShieldExclamationIcon,
    link: "/admin/reports",
  },
   {
    title: "Models",
    icon: CpuChipIcon, // represents AI / ML models / processing
    link: "/admin/models",
  },
  {
    title: "Get Jsonl",
    icon: DocumentTextIcon, // represents JSON / structured data
    link: "/admin/jsonl",
  },
];

const AdminSideNav = () => {
  const pathname = usePathname();
  const t = useTranslations("AdminNavigation");

  return (
    <div className=" min-w-52 px-4 py-4 rounded-2xl">
      <nav className="flex flex-col gap-1">
        {navData.map((item) => (
          <Link
            key={item.link}
            className={clsx(
              "flex items-center gap-2 px-2 py-1 rounded-lg border border-transparent transition",
              pathname === item.link &&
                "shadow-lg bg-white border border-gray-300 dark:bg-default dark:border-default",
            )}
            href={item.link}
          >
            <item.icon height={20} width={20} />
            <span>{t(item.title)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminSideNav;
