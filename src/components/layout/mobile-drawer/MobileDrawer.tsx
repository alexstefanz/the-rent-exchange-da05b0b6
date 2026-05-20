import { useEffect, useRef, useState, TouchEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import logoImage from "@/assets/rentli_logo.webp";
import { cn } from "@/lib/utils";
import { DrawerCategoryExplorer } from "./DrawerCategoryExplorer";
import { AccountHubBody } from "../AccountHubMenu";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function MobileDrawer({ open, onClose, onLogout }: Props) {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Swipe to close
  const touchStart = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  const onTouchStart = (e: TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchMove = (e: TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = e.touches[0].clientX - touchStart.current;
    if (delta < 0) setDragX(Math.max(delta, -300));
  };
  const onTouchEnd = () => {
    if (dragX < -70) onClose();
    setDragX(0);
    touchStart.current = null;
  };

  const LangButton = ({ code, label }: { code: "ro" | "en"; label: string }) => (
    <button
      onClick={() => setLanguage(code)}
      className={cn(
        "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
        language === code
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-pressed={language === code}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: open ? `translateX(${dragX}px)` : "translateX(-100%)",
          transitionProperty: dragX !== 0 ? "none" : "transform",
        }}
        className={`fixed top-0 left-0 z-50 h-[100dvh] w-[88vw] max-w-[360px] bg-background/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] lg:hidden ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <Link to="/" onClick={onClose} className="flex items-center">
              <img src={logoImage} alt="Rentli" className="h-7 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              {/* RO / EN segmented switch */}
              <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
                <LangButton code="ro" label="RO" />
                <LangButton code="en" label="EN" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-full"
                aria-label={t("Închide", "Close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain pb-24"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex flex-col gap-2 py-2">
              {user && <AccountHubBody onNavigate={onClose} />}
              <DrawerCategoryExplorer onNavigate={onClose} />
            </div>
          </div>

          {/* Footer: logout / login */}
          <div
            className="border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 pt-3"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            {user ? (
              <Button
                variant="ghost"
                onClick={() => { onClose(); onLogout(); }}
                className="w-full h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("Deconectare", "Log out")}
              </Button>
            ) : (
              <Button asChild className="w-full h-11 rounded-xl">
                <Link to="/auth" onClick={onClose}>
                  {t("Autentificare", "Login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
