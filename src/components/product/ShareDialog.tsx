import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Mail, MessageCircle, Facebook, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
  image?: string;
}

const ShareDialog = ({ open, onOpenChange, url, title, image }: Props) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: t("Link copiat", "Link copied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("Nu am putut copia link-ul", "Could not copy link"), variant: "destructive" });
    }
  };

  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  const channels = [
    { name: "WhatsApp", icon: MessageCircle, color: "bg-green-500", href: `https://wa.me/?text=${encTitle}%20${encUrl}` },
    { name: "Facebook", icon: Facebook, color: "bg-blue-600", href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}` },
    { name: "Telegram", icon: Send, color: "bg-sky-500", href: `https://t.me/share/url?url=${encUrl}&text=${encTitle}` },
    { name: "Email", icon: Mail, color: "bg-muted-foreground", href: `mailto:?subject=${encTitle}&body=${encUrl}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{t("Distribuie acest produs", "Share this product")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
          {image && <img src={image} alt={title} className="h-12 w-12 rounded-lg object-cover shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground line-clamp-1">{title}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{url}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-2">
          {channels.map((c) => (
            <a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className={`h-12 w-12 rounded-2xl ${c.color} text-white flex items-center justify-center`}>
                <c.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground">{c.name}</span>
            </a>
          ))}
        </div>

        <Button onClick={copyLink} variant="outline" className="w-full h-11 mt-2">
          {copied ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? t("Copiat!", "Copied!") : t("Copiază link-ul", "Copy link")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;