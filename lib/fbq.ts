// Browser-side Meta pixel helpers. No-op on the server and before fbq loads,
// so these are safe to call from anywhere in a client component.

type FbqFn = (...args: unknown[]) => void;

function getFbq(): FbqFn | null {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { fbq?: FbqFn }).fbq;
  return typeof f === "function" ? f : null;
}

/**
 * Custom pixel event fired on every affiliate offer-link click. In Events
 * Manager this becomes a Custom Conversion ("AffiliateClick") the watchlongevity
 * ad account can optimize delivery on. We send no PII — just what was clicked.
 */
export function trackAffiliateClick(p: {
  product: string;
  category: string;
  storefront?: string;
  url: string;
  value?: number;
}): void {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("trackCustom", "AffiliateClick", {
    content_name: p.product,
    content_category: p.category,
    storefront: p.storefront ?? "",
    destination: p.url,
    ...(p.value ? { value: p.value, currency: "USD" } : {}),
  });
}
