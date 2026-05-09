import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Flag, Ban, Mail, Phone, MessageCircle, Image as ImageIcon, Video, Link2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  fetchConversationAttachments,
  getSignedChatMedia,
  blockUser,
  reportMessage,
  type AttachmentRow,
} from "@/lib/chatMedia";
import { extractUrls } from "@/lib/urlScanner";
import { getOwnerContactInfo } from "@/features/messaging/messagingApi";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  conversationId: string;
  peerId: string;
  peerName: string | null;
  peerAvatar: string | null;
  className?: string;
}

export function InfoPanel({ conversationId, peerId, peerName, peerAvatar, className }: Props) {
  const { t } = useLanguage();
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<{ phone: string | null; email: string | null; whatsapp: string | null } | null>(null);
  const [linkUrls, setLinkUrls] = useState<string[]>([]);
  const [kycLevel, setKycLevel] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchConversationAttachments(conversationId);
      if (cancelled) return;
      setAttachments(list);
      const map: Record<string, string> = {};
      await Promise.all(
        list.map(async (a) => {
          const path = a.kind === "video" && a.thumbnail_path ? a.thumbnail_path : a.storage_path;
          const url = await getSignedChatMedia(path);
          if (url) map[a.id] = url;
        })
      );
      if (!cancelled) setThumbs(map);

      // Fetch all messages once for link scan
      const { data: msgs } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", conversationId);
      if (!cancelled && msgs) {
        const all = new Set<string>();
        msgs.forEach((m: any) => extractUrls(m.content || "").forEach((u) => all.add(u)));
        setLinkUrls(Array.from(all));
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    if (!peerId) return;
    getOwnerContactInfo(peerId).then((info) =>
      setContact(info ? { phone: info.phone, email: info.email, whatsapp: info.whatsapp } : null)
    );
    supabase
      .from("profiles")
      .select("kyc_level, created_at")
      .eq("id", peerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setKycLevel((data as any).kyc_level || null);
          setMemberSince((data as any).created_at || null);
        }
      });
  }, [peerId]);

  const images = useMemo(() => attachments.filter((a) => a.kind === "image"), [attachments]);
  const videos = useMemo(() => attachments.filter((a) => a.kind === "video"), [attachments]);

  const handleBlock = async () => {
    const ok = await blockUser(peerId);
    toast[ok ? "success" : "error"](
      ok
        ? t("Utilizatorul a fost blocat", "User blocked")
        : t("Eroare la blocare", "Block failed")
    );
  };

  const handleReport = async () => {
    const ok = await reportMessage({ reason: `Conversation ${conversationId}` });
    toast[ok ? "success" : "error"](
      ok
        ? t("Raportare trimisă", "Report submitted")
        : t("Eroare la raportare", "Report failed")
    );
  };

  const memberYear = memberSince ? new Date(memberSince).getFullYear() : null;

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="p-5 border-b text-center">
        <Avatar className="h-20 w-20 mx-auto mb-3">
          <AvatarImage src={peerAvatar || undefined} />
          <AvatarFallback className="text-xl">{peerName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-base">{peerName || t("Utilizator", "User")}</p>
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {kycLevel && kycLevel !== "NONE" && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 gap-1">
              <ShieldCheck className="h-3 w-3" /> {t("Verificat", "Verified")}
            </Badge>
          )}
          {memberYear && (
            <span className="text-xs text-muted-foreground">
              {t("Membru din", "Member since")} {memberYear}
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="media" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 grid grid-cols-3">
          <TabsTrigger value="media" className="text-xs">{t("Media", "Media")}</TabsTrigger>
          <TabsTrigger value="links" className="text-xs">{t("Linkuri", "Links")}</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs">{t("Contact", "Contact")}</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="media" className="mt-0 space-y-4">
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> {t("Imagini", "Images")} ({images.length})
              </h4>
              {images.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("Nicio imagine partajată", "No shared images")}</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {images.map((a) => (
                    <div key={a.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {thumbs[a.id] ? (
                        <img src={thumbs[a.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" /> {t("Video", "Videos")} ({videos.length})
              </h4>
              {videos.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("Niciun video partajat", "No shared videos")}</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {videos.map((a) => (
                    <div key={a.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                      {thumbs[a.id] && (
                        <img src={thumbs[a.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="links" className="mt-0">
            {linkUrls.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("Niciun link partajat", "No shared links")}</p>
            ) : (
              <ul className="space-y-2">
                {linkUrls.map((u) => (
                  <li key={u} className="text-xs">
                    <a
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg border border-border/60 hover:bg-muted truncate"
                    >
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{u}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="contact" className="mt-0 space-y-2">
            {!contact || (!contact.phone && !contact.email && !contact.whatsapp) ? (
              <p className="text-xs text-muted-foreground">
                {t(
                  "Datele de contact devin vizibile după o rezervare confirmată.",
                  "Contact info becomes visible after a confirmed booking."
                )}
              </p>
            ) : (
              <>
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted text-sm truncate">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 hover:bg-muted text-sm text-emerald-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp: {contact.whatsapp}
                  </a>
                )}
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t p-3 grid grid-cols-2 gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Flag className="h-3.5 w-3.5" /> {t("Raportează", "Report")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Raportează conversația", "Report conversation")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("Echipa noastră va revizui conversația.", "Our team will review this conversation.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleReport}>{t("Raportează", "Report")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
              <Ban className="h-3.5 w-3.5" /> {t("Blochează", "Block")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Blochează utilizatorul?", "Block user?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("Nu veți mai putea trimite sau primi mesaje de la acest utilizator.", "You will no longer send or receive messages from this user.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Anulează", "Cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleBlock}>{t("Blochează", "Block")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}