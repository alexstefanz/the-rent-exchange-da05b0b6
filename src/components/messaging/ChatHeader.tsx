import { ArrowLeft, Phone, MoreHorizontal, Package, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  name: string | null;
  avatarUrl: string | null;
  online: boolean;
  typing: boolean;
  onBack?: () => void;
  onInfo?: () => void;
  phone?: string | null;
  productUrl?: string | null;
  profileUrl?: string | null;
  showPhone?: boolean;
}

export function ChatHeader({ name, avatarUrl, online, typing, onBack, onInfo, phone, productUrl, profileUrl, showPhone = false }: Props) {
  const { t } = useLanguage();
  const status = typing ? t("scrie...", "typing...") : online ? "Online" : "Offline";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-background">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold truncate">{name || t("Utilizator", "User")}</span>
        <span className="text-xs text-muted-foreground truncate">
          <span className={cn(typing && "text-primary font-medium")}>{status}</span>
          <span className="hidden sm:inline"> · {t("Răspunde de obicei în câteva minute", "Usually replies within minutes")}</span>
        </span>
      </div>
      {showPhone && phone && (
        <Button asChild variant="outline" size="icon" className="shrink-0 rounded-xl" aria-label={t("Apelează", "Call")}>
          <a href={`tel:${phone}`}><Phone className="h-4 w-4" /></a>
        </Button>
      )}
      {(productUrl || profileUrl) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 rounded-xl" aria-label={t("Mai multe", "More")}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {productUrl && (
              <DropdownMenuItem asChild><Link to={productUrl}><Package className="h-4 w-4 mr-2" />{t("Vezi produs", "View product")}</Link></DropdownMenuItem>
            )}
            {profileUrl && (
              <DropdownMenuItem asChild><Link to={profileUrl}><User className="h-4 w-4 mr-2" />{t("Vezi profil", "View profile")}</Link></DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onInfo && (
        <Button onClick={onInfo} className="shrink-0 rounded-xl px-3 sm:px-4">
          {t("Vezi detalii", "View details")}
        </Button>
      )}
    </div>
  );
}
