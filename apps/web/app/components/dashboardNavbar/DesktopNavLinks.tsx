"use client";

import NavLink from "./NavLink";
import { MAIN_NAV_ITEMS } from "./constants";

export default function DesktopNavLinks() {
  return (
    <>
      {MAIN_NAV_ITEMS.map((item) => (
        <NavLink key={item} href={`/${item.toLowerCase()}`}>
          {item}
        </NavLink>
      ))}
    </>
  );
}
