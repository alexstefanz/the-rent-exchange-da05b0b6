import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { createUserTicket } from "@/features/tickets/userTicketsApi";
import { usePageSeo } from "@/hooks/usePageSeo";

const Contact = () => {
  const { t } = useLanguage();
  usePageSeo({
    title: t("Contact — Rentli", "Contact — Rentli"),
    description: t(
      "Contactează echipa Rentli pentru suport, parteneriate sau întrebări.",
      "Get in touch with the Rentli team for support, partnerships or questions.",
    ),
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: t("Te rugăm să completezi toate câmpurile.", "Please fill in all fields."), variant: "destructive" });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: t("Trebuie să fii autentificat", "Authentication required"),
        description: t("Autentifică-te pentru a deschide un tichet de suport.", "Sign in to open a support ticket."),
        variant: "destructive",
      });
      navigate(`/auth?redirect=${encodeURIComponent("/contact")}`);
      return;
    }

    setSubmitting(true);
    try {
      const description = `Nume: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
      const ticket = await createUserTicket({
        title: form.subject,
        description,
        category_group: "USER",
        category_type: "GENERAL_INQUIRY",
        priority: "MEDIUM",
      });
      toast({
        title: t("Tichet creat", "Ticket created"),
        description: t(
          `Te-am redirecționat la conversație (${ticket.public_id ?? "TCK"}).`,
          `Redirecting you to the conversation (${ticket.public_id ?? "TCK"}).`,
        ),
      });
      setForm({ name: "", email: "", subject: "", message: "" });
      navigate("/suport");
    } catch (err) {
      toast({
        title: t("Eroare la trimitere", "Failed to send"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-12 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          {t("Înapoi", "Back")}
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">{t("Contactează-ne", "Contact Us")}</h1>
            <CardDescription>
              {t(
                "Trimite-ne un mesaj și îți răspundem în maximum 48 de ore.",
                "Send us a message and we'll reply within 48 hours.",
              )}
            </CardDescription>

            <p className="text-sm text-muted-foreground mt-2">
              Email: <a href="mailto:office@rentli.ro" className="text-primary hover:underline">office@rentli.ro</a>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Nume", "Name")} *</Label>
                  <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("Numele tău", "Your name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("E-mail", "Email")} *</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t("adresa@email.com", "address@email.com")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t("Subiect", "Subject")} *</Label>
                <Input id="subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder={t("Subiectul mesajului", "Message subject")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("Mesaj", "Message")} *</Label>
                <Textarea id="message" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={t("Scrie mesajul tău aici...", "Write your message here...")} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? t("Se trimite...", "Sending...") : t("Trimite mesajul", "Send message")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t(
                  "Mesajul tău devine un tichet pe care îl poți urmări din Suport & Tichete. Răspundem în maximum 48 de ore.",
                  "Your message becomes a ticket you can track from Support & Tickets. We reply within 48 hours.",
                )}
              </p>

            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
