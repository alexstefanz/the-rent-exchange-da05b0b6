import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve((req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id") || "";
  const status = url.searchParams.get("status") || "success";
  const deepLink = `rentli://checkout?status=${encodeURIComponent(status)}${
    sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ""
  }`;

  const html = `<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rentli</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #fcfaf8;
        color: #1a1410;
        text-align: center;
        padding: 24px;
      }
      p { margin: 0; color: #6b6360; }
      a {
        display: inline-block;
        margin-top: 8px;
        padding: 14px 28px;
        border-radius: 12px;
        background: #f59e0b;
        color: #fff;
        font-weight: 600;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <h2>Te redirecționăm în aplicație…</h2>
    <p>Dacă nu se deschide automat, apasă mai jos.</p>
    <a href="${deepLink}">Revino în aplicația Rentli</a>
    <script>
      setTimeout(function () {
        window.location.href = ${JSON.stringify(deepLink)};
      }, 100);
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
});
