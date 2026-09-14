import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const APP_URL = "https://www.rentli.ro";

serve((req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id") || "";
  const status = url.searchParams.get("status") || "success";

  const redirectUrl = `${APP_URL}/checkout/mobile-return?status=${encodeURIComponent(
    status,
  )}${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ""}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Cache-Control": "no-store, max-age=0",
    },
  });
});
