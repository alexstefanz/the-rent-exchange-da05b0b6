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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
import { MediaLightbox } from "./MediaLightbox";
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
  const [contact, setContact] = useState<{ phone: string | null; email: string | null } | null>(null);
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
      setContact(info ? { phone: info.phone, email: info.email } : null)
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
  const media = useMemo(() => [...images, ...videos], [images, videos]);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  const handleBlock = async () => {
    const ok = await blockUser(peerId);
    toast[ok ? "success" : "error"](
      ok
        ? t("Utilizatorul a fost blocat", "User blocked")
        : t("Eroare la blocare", "Block failed")
    );
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>("inappropriate_language");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const submitReport = async () => {
    setReportSubmitting(true);
    const ok = await reportMessage({
      conversationId,
      reportedUserId: peerId,
      category: reportCategory,
      reason: reportDetails.trim().slice(0, 500) || null,
    });
    setReportSubmitting(false);
    toast[ok ? "success" : "error"](
      ok
        ? t("Raportare trimisă", "Report submitted")
        : t("Eroare la raportare", "Report failed")
    );
    if (ok) {
      setReportOpen(false);
      setReportDetails("");
      setReportCategory("inappropriate_language");
    }
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
                  {images.map((a, i) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setLightbox({ open: true, index: i })}
                      className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {thumbs[a.id] ? (
                        <img src={thumbs[a.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full animate-pulse" />
                      )}
                    </button>
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
                  {videos.map((a, i) => (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setLightbox({ open: true, index: images.length + i })}
                      className="aspect-square rounded-lg overflow-hidden bg-muted relative hover:opacity-90 transition cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {thumbs[a.id] && (
                        <img src={thumbs[a.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                    </button>
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
            {!contact || (!contact.phone && !contact.email) ? (
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
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t p-3 grid grid-cols-2 gap-2">
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Flag className="h-3.5 w-3.5" /> {t("Raportează", "Report")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Raportează conversația", "Report conversation")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Spune-ne ce este în neregulă. Echipa de moderare va analiza conversația.",
                  "Tell us what's wrong. Our moderation team will review this conversation."
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Motiv", "Reason")}</Label>
                <Select value={reportCategory} onValueChange={setReportCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inappropriate_language">{t("Limbaj licențios / injurii", "Offensive language / insults")}</SelectItem>
                    <SelectItem value="harassment">{t("Hărțuire / agresiune", "Harassment / aggression")}</SelectItem>
                    <SelectItem value="threats">{t("Amenințări", "Threats")}</SelectItem>
                    <SelectItem value="fraud">{t("Tentativă de fraudă", "Fraud attempt")}</SelectItem>
                    <SelectItem value="spam">{t("Spam / reclame", "Spam / ads")}</SelectItem>
                    <SelectItem value="other">{t("Altceva", "Other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Detalii (opțional)", "Details (optional)")}</Label>
                <Textarea
                  maxLength={500}
                  rows={4}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder={t("Adaugă context dacă e necesar...", "Add context if needed...")}
                />
                <p className="text-xs text-muted-foreground text-right">{reportDetails.length}/500</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reportSubmitting}>
                {t("Anulează", "Cancel")}
              </Button>
              <Button onClick={submitReport} disabled={reportSubmitting}>
                {t("Trimite raport", "Send report")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      <MediaLightbox
        attachments={media}
        startIndex={lightbox.index}
        open={lightbox.open}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}