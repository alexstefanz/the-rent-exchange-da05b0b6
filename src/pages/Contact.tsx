import { useState } from "react";
import { Link } from "react-router-dom";
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

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: t("Te rugăm să completezi toate câmpurile.", "Please fill in all fields."), variant: "destructive" });
      return;
    }
    const body = `Nume: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    const mailto = `mailto:office@rentli.ro?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
    toast({ title: t("Mesajul a fost pregătit!", "Message prepared!"), description: t("Se deschide clientul de email.", "Opening email client.") });
    setForm({ name: "", email: "", subject: "", message: "" });
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
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("Contactează-ne", "Contact Us")}</CardTitle>
            <CardDescription>
              {t(
                "Trimite-ne un mesaj și te vom contacta cât mai curând posibil.",
                "Send us a message and we'll get back to you as soon as possible."
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
              <Button type="submit" className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
                {t("Trimite mesajul", "Send message")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
