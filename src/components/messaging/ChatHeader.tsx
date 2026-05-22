import { ArrowLeft, Phone, Info, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  name: string | null;
  avatarUrl: string | null;
  productTitle: string;
  online: boolean;
  typing: boolean;
  onBack?: () => void;
  onInfo?: () => void;
  phone?: string | null;
  productUrl?: string | null;
  showPhone?: boolean;
}

export function ChatHeader({ name, avatarUrl, productTitle, online, typing, onBack, onInfo, phone, productUrl, showPhone = false }: Props) {
  const { t } = useLanguage();
  const status = typing
    ? t("scrie...", "typing...")
    : online
    ? t("Online", "Online")
    : t("Offline", "Offline");

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background transition-colors",
            online ? "bg-emerald-500" : "bg-muted-foreground/40"
          )}
        />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold text-sm truncate">{name || t("Utilizator", "User")}</span>
        <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <span className={cn("transition-colors", typing && "text-primary font-medium")}>
            {status}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="truncate">{productTitle}</span>
        </span>
      </div>
      {showPhone && phone && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={`tel:${phone}`} className="shrink-0">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-600" asChild>
                  <span><Phone className="h-5 w-5" /></span>
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>{t("Apelează", "Call")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {productUrl && (
        <Button
          asChild
          size="sm"
          aria-label={t("Vezi produs", "View product")}
          className="shrink-0 bg-primary hover:bg-[#F98715] text-primary-foreground px-2.5 lg:px-3"
        >
          <Link to={productUrl}>
            <Package className="h-4 w-4 lg:mr-1.5" />
            <span className="hidden lg:inline">{t("Vezi produs", "View product")}</span>
          </Link>
        </Button>
      )}
      {onInfo && (
        <Button variant="ghost" size="icon" onClick={onInfo} className="shrink-0 lg:hidden">
          <Info className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}