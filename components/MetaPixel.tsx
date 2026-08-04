"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// watchlongevity pixel (act_2151780552311901). Pixel IDs are not secret;
// override with NEXT_PUBLIC_META_PIXEL_ID if this ever changes.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1405518561382807";

export default function MetaPixel() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  // App Router navigations don't reload the page, so fire PageView on route
  // change. The base snippet already fires the first PageView — skip the
  // initial effect run so we don't double-count the landing.
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (fbq) fbq("track", "PageView");
  }, [pathname]);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
