export const NAV_BADGE_REFRESH_EVENT = "inkura:nav-badge-refresh";

export function dispatchNavBadgeRefresh(endpoint: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NAV_BADGE_REFRESH_EVENT, {
      detail: { endpoint },
    })
  );
}
