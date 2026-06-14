"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import NavLink from "./NavLink";
import { MAIN_NAV_ITEMS } from "./constants";

export default function DesktopNavLinks({ light = false }: { light?: boolean }) {
  const t = useUILanguageText("Navigation");

  return (
    <>
      {MAIN_NAV_ITEMS.map((item) => (
        <NavLink key={item} href={`/${item.toLowerCase()}`} light={light}>
          {t(item)}
        </NavLink>
      ))}
    </>
  );
}
