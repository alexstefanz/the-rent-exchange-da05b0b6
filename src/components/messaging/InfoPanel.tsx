import { useEffect, useMemo, useState } from "react";
import { Flag, Ban, Mail, Phone, Image as ImageIcon, Video, ChevronRight, Calendar, Tag, Moon, FileText, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getRentalContext, type RentalContextRow } from "@/features/messaging/messagingApi";
import { RentalStatusBadge } from "./RentalStatusBadge";
import { formatRentalPeriod, formatRon, rentalUrl } from "./BookingSummaryCard";

const actionCls = "flex flex-col items-center justify-center gap-1 rounded-xl border border-border/60 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors";
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
import { toast } from "@/components/ui/sonner";
import {
  fetchConversationAttachments,
  getSignedChatMedia,
  blockUser,
  reportMessage,
  type AttachmentRow,
} from "@/lib/chatMedia";
import { extractUrls } from "@/lib/urlScanner";
import { getOwnerContactInfo, isRentalPaidLike } from "@/features/messaging/messagingApi";
import { supabase } from "@/integrations/supabase/client";
import { MediaLightbox } from "./MediaLightbox";
import { cn } from "@/lib/utils";

function isOwnerOf(_r: RentalContextRow, _me: string, _peer: string) {
  // Viewer role is decided by the parent; default to renter route which works for both roles.
  return false;
}

interface Props {
  conversationId: string;
  peerId: string;
  peerName: string | null;
  peerAvatar: string | null;
  rentalsId?: string | null;
  className?: string;
}

export function InfoPanel({ conversationId, peerId, peerName, peerAvatar, rentalsId, className }: Props) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: rental } = useQuery<RentalContextRow | null>({
    queryKey: ["rental-context", rentalsId],
    queryFn: () => (rentalsId ? getRentalContext(rentalsId) : Promise.resolve(null)),
    enabled: !!rentalsId,
    staleTime: 30_000,
  });
  const productHref = rental ? `/produs/${rental.product_slug || rental.product_id}` : null;
  const bookingHref = rental ? rentalUrl(rental, user?.id !== peerId && rental ? !!user && user.id !== undefined && isOwnerOf(rental, user.id, peerId) : false) : "#";
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<{ phone: string | null; email: string | null } | null>(null);
  const [linkUrls, setLinkUrls] = useState<string[]>([]);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!rentalsId) { setIsPaid(false); return; }
    supabase
      .from("rentals")
      .select("paid_at,payment_status")
      .eq("id", rentalsId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsPaid(isRentalPaidLike((data as any)?.payment_status, (data as any)?.paid_at));
      });
    return () => { cancelled = true; };
  }, [rentalsId]);

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
    if (isPaid) {
      getOwnerContactInfo(peerId).then((info) =>
        setContact(info ? { phone: info.phone, email: info.email } : null)
      );
    } else {
      setContact(null);
    }
    supabase
      .from("profiles")
      .select("created_at")
      .eq("id", peerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMemberSince((data as any).created_at || null);
        }
      });
  }, [peerId, isPaid]);

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
      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 grid grid-cols-2">
          <TabsTrigger value="details" className="text-xs">{t("Detalii", "Details")}</TabsTrigger>
          <TabsTrigger value="media" className="text-xs">{t("Media", "Media")}</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="details" className="mt-0 space-y-5">
            {rental && (
              <section>
                <h4 className="text-sm font-semibold mb-2">{t("Produs închiriat", "Rented item")}</h4>
                <div className="rounded-2xl border border-border/60 p-3 space-y-2.5">
                  <Link to={productHref || "#"} className="flex items-center gap-3 pb-2.5 border-b border-border/60">
                    {rental.product_image ? <img src={rental.product_image} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="h-12 w-12 rounded-xl bg-muted" />}
                    <span className="flex-1 text-sm font-medium line-clamp-2">{rental.product_title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{formatRentalPeriod(rental.start_date, rental.end_date, language)} ({rental.rental_days} {rental.rental_days === 1 ? t("zi", "day") : t("zile", "days")})</p>
                  <p className="flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-muted-foreground" />{formatRon(rental.subtotal)}</p>
                  <RentalStatusBadge rental={rental} />
                </div>
              </section>
            )}

            <section>
              <h4 className="text-sm font-semibold mb-2">{t("Persoană", "Person")}</h4>
              <Link to={`/utilizator/${peerId}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-muted/50">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={peerAvatar || undefined} />
                  <AvatarFallback>{peerName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{peerName || t("Utilizator", "User")}</p>
                  {memberYear && <p className="text-xs text-muted-foreground">{t("Membru din", "Member since")} {memberYear}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {isPaid && contact?.phone ? (
                  <a href={`tel:${contact.phone}`} className={actionCls}><Phone className="h-4 w-4" />{t("Sună", "Call")}</a>
                ) : (
                  <span className={cn(actionCls, "opacity-50 cursor-not-allowed")} title={t("Disponibil după plată", "Available after payment")}><Phone className="h-4 w-4" />{t("Sună", "Call")}</span>
                )}
                <Link to={`/utilizator/${peerId}`} className={actionCls}><UserIcon className="h-4 w-4" />{t("Vezi profil", "Profile")}</Link>
                <button type="button" onClick={() => setReportOpen(true)} className={actionCls}><Flag className="h-4 w-4" />{t("Raportează", "Report")}</button>
              </div>
              {isPaid && contact?.email && (
                <a href={`mailto:${contact.email}`} className="mt-2 flex items-center gap-2 text-xs text-muted-foreground truncate"><Mail className="h-3.5 w-3.5" />{contact.email}</a>
              )}
            </section>

            {rental && (
              <section>
                <h4 className="text-sm font-semibold mb-2">{t("Detalii rezervare", "Booking details")}</h4>
                <Link to={bookingHref} className="block space-y-2.5 rounded-xl p-1.5 hover:bg-muted/50 text-sm">
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{formatRentalPeriod(rental.start_date, rental.end_date, language)}<ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></p>
                  <p className="flex items-center gap-2"><Moon className="h-4 w-4 text-muted-foreground" />{rental.rental_days} {rental.rental_days === 1 ? t("zi", "day") : t("zile", "days")}</p>
                  <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" />{formatRon(rental.subtotal)}</p>
                  <p className="flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" />ID: {rental.public_id}</p>
                </Link>
              </section>
            )}
          </TabsContent>

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

        </div>
      </Tabs>

      <div className="border-t p-4">
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
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
            <Button variant="outline" className="w-full gap-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive">
              <Ban className="h-4 w-4" /> {t("Blochează utilizatorul", "Block user")}
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