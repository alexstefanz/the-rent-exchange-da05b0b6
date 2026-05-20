import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, ShieldAlert, ShieldX, Flag, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractUrls, scanUrl, reportUrl, type UrlScanResult } from "@/lib/urlScanner";
import { toast } from "@/hooks/use-toast";

interface Props {
  text: string;
  messageId?: string;
  isOwn?: boolean;
}

type ScanState = "loading" | UrlScanResult;

export function MessageContent({ text, messageId, isOwn = false }: Props) {
  const { t } = useLanguage();
  const [scans, setScans] = useState<Record<string, ScanState>>({});
  const [confirmUrl, setConfirmUrl] = useState<{ url: string; result: UrlScanResult } | null>(null);

  const urls = extractUrls(text);

  useEffect(() => {
    let cancelled = false;
    urls.forEach((u) => {
      if (scans[u]) return;
      setScans((prev) => ({ ...prev, [u]: "loading" }));
      scanUrl(u).then((res) => {
        if (!cancelled) setScans((prev) => ({ ...prev, [u]: res }));
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Tokenize: split text by URLs while preserving order
  const tokens: { type: "text" | "url"; value: string }[] = [];
  if (urls.length === 0) {
    tokens.push({ type: "text", value: text });
  } else {
    let cursor = 0;
    for (const u of urls) {
      const idx = text.indexOf(u, cursor);
      if (idx < 0) continue;
      if (idx > cursor) tokens.push({ type: "text", value: text.slice(cursor, idx) });
      tokens.push({ type: "url", value: u });
      cursor = idx + u.length;
    }
    if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  }

  const handleReport = async (url: string) => {
    const ok = await reportUrl(url, "user_reported", messageId);
    toast({
      title: ok
        ? t("Mulțumim! Linkul a fost raportat.", "Thanks! The link was reported.")
        : t("Nu s-a putut raporta linkul.", "Could not report the link."),
    });
  };

  const renderUrl = (url: string, key: number) => {
    const state = scans[url];
    const externalHref = /^https?:\/\//i.test(url) ? url : "https://" + url;

    if (!state || state === "loading") {
      return (
        <span key={key} className="inline-flex items-center gap-1 underline decoration-dotted opacity-70">
          {url}
          <Loader2 className="h-3 w-3 animate-spin" />
        </span>
      );
    }

    if (state.classification === "BLOCKED") {
      return (
        <span key={key} className="inline-flex items-center gap-1 line-through text-destructive">
          <ShieldX className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{state.host}</span>
          <button
            onClick={() => setConfirmUrl({ url: externalHref, result: state })}
            className="ml-1 underline text-xs not-italic"
          >
            {t("detalii", "details")}
          </button>
        </span>
      );
    }

    if (state.classification === "WARNING") {
      return (
        <a
          key={key}
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="inline-flex items-center gap-1 underline text-yellow-700 dark:text-yellow-400 break-all"
          onClick={(e) => {
            if (!confirm(t(
              "Acest link este către un domeniu extern neverificat. Continui?",
              "This link points to an unverified external domain. Continue?",
            ))) e.preventDefault();
          }}
        >
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="break-all">{url}</span>
        </a>
      );
    }

    return (
      <a
        key={key}
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className={`inline-flex items-center gap-1 underline break-all ${
          isOwn ? "text-primary-foreground" : "text-primary"
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="break-all">{url}</span>
      </a>
    );
  };

  // Collect banners for WARNING/BLOCKED
  const banners = urls
    .map((u) => ({ url: u, state: scans[u] }))
    .filter((x) => x.state && x.state !== "loading") as { url: string; state: UrlScanResult }[];
  const hasBlocked = banners.some((b) => b.state.classification === "BLOCKED");
  const hasWarning = banners.some((b) => b.state.classification === "WARNING");

  return (
    <>
      <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
        {tokens.map((tk, i) =>
          tk.type === "text" ? <span key={i}>{tk.value}</span> : renderUrl(tk.value, i),
        )}
      </p>

      {hasBlocked && (
        <div className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive flex items-start gap-2">
          <ShieldX className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">
              {t("Link blocat pentru protecția ta", "Link blocked for your protection")}
            </div>
            <div className="opacity-80">
              {t(
                "Acest link poate fi periculos (phishing sau malware).",
                "This link may be dangerous (phishing or malware).",
              )}
            </div>
          </div>
        </div>
      )}
      {hasWarning && !hasBlocked && (
        <div className="mt-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">
              {t("Atenție: domeniu extern neverificat", "Warning: unverified external domain")}
            </div>
            <div className="opacity-80">
              {t(
                "Verifică expeditorul înainte de a deschide linkul.",
                "Check the sender before opening the link.",
              )}
            </div>
          </div>
        </div>
      )}

      {banners.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {banners.map((b) => (
            <button
              key={b.url}
              onClick={() => handleReport(b.url)}
              className="inline-flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 underline"
            >
              <Flag className="h-3 w-3" />
              {t("Raportează", "Report")} ({b.state.host})
            </button>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmUrl} onOpenChange={(o) => !o && setConfirmUrl(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-destructive" />
              {t("Link periculos detectat", "Dangerous link detected")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t(
                  "Sistemul a clasificat acest link ca fiind periculos. Poate conține phishing, malware sau înșelăciuni.",
                  "Our system flagged this link as dangerous. It may contain phishing, malware or scams.",
                )}
              </span>
              <span className="block font-mono text-xs break-all bg-muted p-2 rounded">
                {confirmUrl?.url}
              </span>
              <span className="block text-xs">
                {t("Risk score", "Risk score")}: <strong>{confirmUrl?.result.risk_score}/100</strong>
              </span>
              <span className="block text-xs">
                {t("Motive", "Reasons")}: {confirmUrl?.result.reasons.join(", ")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (confirmUrl) window.open(confirmUrl.url, "_blank", "noopener,noreferrer");
                setConfirmUrl(null);
              }}
            >
              {t("Văd riscul, deschide oricum", "I see the risk, open anyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}