import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, HelpCircle, MessageCircle, FileText, ChevronRight, Star, Upload, X, Smile, Meh, Frown, ThumbsUp, Lightbulb, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createUserTicket, addUserTicketAttachment } from "@/features/tickets/userTicketsApi";

const EMOJI_RATINGS = [
  { emoji: "😡", label: "Foarte nemulțumit", value: 1 },
  { emoji: "😞", label: "Nemulțumit", value: 2 },
  { emoji: "😐", label: "Neutru", value: 3 },
  { emoji: "😊", label: "Mulțumit", value: 4 },
  { emoji: "😍", label: "Foarte mulțumit", value: 5 },
];

const FEEDBACK_TYPES = [
  { icon: Lightbulb, label: "Sugestie", labelEn: "Suggestion", color: "text-yellow-500" },
  { icon: AlertTriangle, label: "Ceva nu a mers bine", labelEn: "Something went wrong", color: "text-red-500" },
  { icon: ThumbsUp, label: "Compliment", labelEn: "Compliment", color: "text-green-500" },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const HelpCenter = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Contact form state
  const contactRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submittingContact, setSubmittingContact] = useState(false);

  // Feedback form state
  const [emojiRating, setEmojiRating] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Contact form handlers
  const handleContactChange = (field: string, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: t("Fișierul este prea mare", "File is too large"), description: t("Dimensiunea maximă este 5MB", "Maximum size is 5MB"), variant: "destructive" });
        return false;
      }
      return true;
    });
    setAttachedFiles((prev) => [...prev, ...validFiles].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, subject, message } = contactForm;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({ title: t("Completează toate câmpurile obligatorii", "Fill in all required fields"), variant: "destructive" });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: t("Trebuie să fii autentificat", "Authentication required"),
        description: t("Autentifică-te pentru a deschide un tichet de suport.", "Sign in to open a support ticket."),
        variant: "destructive",
      });
      navigate(`/auth?redirect=${encodeURIComponent("/centru-ajutor")}`);
      return;
    }

    setSubmittingContact(true);
    try {
      const description = `Nume: ${name}\nEmail: ${email}\n\n${message}`;
      const ticket = await createUserTicket({
        title: subject,
        description,
        category_group: "USER",
        category_type: "GENERAL_INQUIRY",
        priority: "MEDIUM",
      });

      // Upload attachments best-effort
      for (const f of attachedFiles) {
        try {
          await addUserTicketAttachment(ticket.id, f);
        } catch (err) {
          console.warn("[ticket attachment]", err);
        }
      }

      toast({
        title: t("Tichet creat", "Ticket created"),
        description: t(
          `Te-am redirecționat la conversație (${ticket.public_id ?? "TCK"}).`,
          `Redirecting you to the conversation (${ticket.public_id ?? "TCK"}).`,
        ),
      });
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setAttachedFiles([]);
      navigate("/suport");
    } catch (err) {
      toast({
        title: t("Eroare la trimitere", "Failed to send"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmittingContact(false);
    }
  };

  // Feedback form handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emojiRating) {
      toast({ title: t("Selectează o evaluare", "Select a rating"), variant: "destructive" });
      return;
    }
    if (!feedbackType) {
      toast({ title: t("Selectează tipul de feedback", "Select feedback type"), variant: "destructive" });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: t("Trebuie să fii autentificat", "Authentication required"),
        description: t("Autentifică-te pentru a trimite feedback.", "Sign in to send feedback."),
        variant: "destructive",
      });
      navigate(`/auth?redirect=${encodeURIComponent("/centru-ajutor")}`);
      return;
    }

    setSubmittingFeedback(true);
    try {
      const ratingLabel = EMOJI_RATINGS.find((r) => r.value === emojiRating)?.label || "";
      const title = `[Feedback] ${feedbackType}`;
      const description = `Evaluare: ${ratingLabel} (${emojiRating}/5)\nTip: ${feedbackType}\n\n${feedbackMessage || "(fără mesaj suplimentar)"}`;
      const ticket = await createUserTicket({
        title,
        description,
        category_group: "USER",
        category_type: "GENERAL_INQUIRY",
        priority: "LOW",
      });
      toast({
        title: t("Mulțumim pentru feedback!", "Thanks for your feedback!"),
        description: t(
          `Am creat tichetul ${ticket.public_id ?? "TCK"}.`,
          `Ticket ${ticket.public_id ?? "TCK"} created.`,
        ),
      });
      setEmojiRating(null);
      setFeedbackType(null);
      setFeedbackMessage("");
      navigate("/suport");
    } catch (err) {
      toast({
        title: t("Eroare la trimitere", "Failed to send"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const categories = [
    {
      icon: FileText,
      title: t("Întrebări frecvente", "FAQ"),
      description: t("Găsește răspunsuri la cele mai comune întrebări", "Find answers to the most common questions"),
      color: "bg-primary/10 text-primary",
      action: "link" as const,
      link: "/intrebari-frecvente",
    },
    {
      icon: MessageCircle,
      title: t("Asistență & Contact", "Support & Contact"),
      description: t("Contactează echipa noastră pentru ajutor personalizat", "Contact our team for personalized help"),
      color: "bg-accent/10 text-accent",
      action: "scroll" as const,
      scrollRef: contactRef,
    },
    {
      icon: Star,
      title: t("Feedback", "Feedback"),
      description: t("Spune-ne părerea ta despre platformă", "Tell us what you think about the platform"),
      color: "bg-secondary text-secondary-foreground",
      action: "scroll" as const,
      scrollRef: feedbackRef,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              {t("Centru de Asistență", "Help Center")}
            </h1>
            <p className="text-muted-foreground">
              {t(
                "Cum te putem ajuta astăzi? Găsește răspunsuri sau contactează-ne.",
                "How can we help you today? Find answers or contact us."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 3 Category Cards */}
      <section className="py-12">
        <div className="container px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {categories.map((cat) => {
              const inner = (
                <Card className="group h-full transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg ${cat.color}`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {cat.title}
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardTitle>
                    <CardDescription>{cat.description}</CardDescription>
                  </CardHeader>
                </Card>
              );

              if (cat.action === "link") {
                return <Link key={cat.title} to={cat.link!}>{inner}</Link>;
              }
              return (
                <div key={cat.title} onClick={() => scrollTo(cat.scrollRef!)}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section ref={contactRef} className="py-12 bg-muted/30 scroll-mt-20">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">
                  {t("Asistență & Contact", "Support & Contact")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "Completează formularul și te vom contacta cât mai curând posibil.",
                    "Fill in the form and we'll get back to you as soon as possible."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">{t("Nume", "Name")} *</Label>
                      <Input
                        id="contact-name"
                        value={contactForm.name}
                        onChange={(e) => handleContactChange("name", e.target.value)}
                        placeholder={t("Numele tău", "Your name")}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">{t("E-mail", "Email")} *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => handleContactChange("email", e.target.value)}
                        placeholder={t("email@exemplu.ro", "email@example.com")}
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">{t("Subiect", "Subject")} *</Label>
                    <Input
                      id="contact-subject"
                      value={contactForm.subject}
                      onChange={(e) => handleContactChange("subject", e.target.value)}
                      placeholder={t("Despre ce este vorba?", "What is it about?")}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message">{t("Mesaj", "Message")} *</Label>
                    <Textarea
                      id="contact-message"
                      value={contactForm.message}
                      onChange={(e) => handleContactChange("message", e.target.value)}
                      placeholder={t("Descrie problema sau întrebarea ta...", "Describe your issue or question...")}
                      rows={5}
                      maxLength={2000}
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>{t("Atașamente", "Attachments")} ({t(`max ${MAX_FILES} fișiere, 5MB fiecare`, `max ${MAX_FILES} files, 5MB each`)})</Label>
                    <div
                      className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t("Click pentru a adăuga fișiere", "Click to add files")}
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileAdd}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    {attachedFiles.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {attachedFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                            <span className="truncate">{file.name}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={submittingContact}>
                    {submittingContact ? t("Se trimite...", "Sending...") : t("Trimite mesajul", "Send message")}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t(
                      "Mesajul tău devine un tichet pe care îl poți urmări din Suport & Tichete.",
                      "Your message becomes a ticket you can track from Support & Tickets.",
                    )}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section ref={feedbackRef} className="py-12 scroll-mt-20">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">
                  {t("Părerea ta contează!", "Your opinion matters!")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "Ajută-ne să îmbunătățim platforma cu feedback-ul tău.",
                    "Help us improve the platform with your feedback."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  {/* Emoji Rating */}
                  <div className="space-y-3">
                    <Label>{t("Cum a fost experiența ta?", "How was your experience?")}</Label>
                    <div className="flex items-center justify-center gap-3">
                      {EMOJI_RATINGS.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setEmojiRating(r.value)}
                          className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-all hover:scale-110 ${
                            emojiRating === r.value
                              ? "bg-primary/15 ring-2 ring-primary scale-110"
                              : "bg-secondary hover:bg-secondary/80"
                          }`}
                          title={r.label}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Type */}
                  <div className="space-y-3">
                    <Label>{t("Ce tip de feedback ai?", "What type of feedback do you have?")}</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {FEEDBACK_TYPES.map((ft) => (
                        <button
                          key={ft.label}
                          type="button"
                          onClick={() => setFeedbackType(ft.label)}
                          className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:shadow-sm ${
                            feedbackType === ft.label
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          <ft.icon className={`h-6 w-6 ${ft.color}`} />
                          <span className="text-sm font-medium">{t(ft.label, ft.labelEn)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback-message">{t("Mesaj (opțional)", "Message (optional)")}</Label>
                    <Textarea
                      id="feedback-message"
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder={t("Spune-ne mai multe...", "Tell us more...")}
                      rows={4}
                      maxLength={1000}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {t("Trimite feedback", "Send feedback")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;
