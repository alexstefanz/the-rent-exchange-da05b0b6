import { useEffect, useRef } from "react";

const CBID = "22dfb7ae-31ca-4a65-a044-86e4b671a477";

/**
 * Renders the Cookiebot cookie declaration (auto-generated, always up to date).
 * The external script must be injected at runtime — React cannot render <script> tags.
 */
const CookieDeclaration = ({ culture = "ro" }: { culture?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    const script = document.createElement("script");
    script.id = "CookieDeclaration";
    script.src = `https://consent.cookiebot.com/${CBID}/cd.js`;
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-culture", culture);
    container.appendChild(script);
    return () => {
      container.innerHTML = "";
    };
  }, [culture]);

  return <div ref={containerRef} className="overflow-x-auto text-sm" />;
};

export default CookieDeclaration;
