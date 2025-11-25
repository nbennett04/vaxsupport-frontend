import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { startTransition } from "react";

import { usePathname, useRouter } from "@/i18n/routing";

const locals = [
  {
    label: "English",
    value: "en",
  },
  {
    label: "Español",
    value: "es",
  },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = useLocale();

  const switchLanguage = (locale: string) => {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: locale },
      );
    });
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button radius="full" variant="bordered">
          {locals.find((item) => item.value === currentLocale)?.label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Example with disabled actions">
        {locals.map((local) => (
          <DropdownItem
            key={local.value}
            isDisabled={local.value === currentLocale}
            onPress={() => switchLanguage(local.value)}
          >
            {local.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
