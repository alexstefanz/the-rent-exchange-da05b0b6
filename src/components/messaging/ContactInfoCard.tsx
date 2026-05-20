import { Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContactInfoCardProps {
  ownerName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
}

export function ContactInfoCard({ ownerName, avatarUrl, phone, email }: ContactInfoCardProps) {
  const { t } = useLanguage();
  const hasContactInfo = phone || email;

  const handleCall = () => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = () => {
    window.open(`mailto:${email}`, '_self');
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{ownerName?.charAt(0) || 'P'}</AvatarFallback>
          </Avatar>
          <span>{ownerName || t("Proprietar", "Owner")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasContactInfo ? (
          <p className="text-muted-foreground text-sm">
            {t("Nu există informații de contact disponibile.", "No contact information available.")}
          </p>
        ) : (
          <>
            {phone && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleCall}
              >
                <Phone className="h-4 w-4 text-primary" />
                <span>{phone}</span>
              </Button>
            )}
            {email && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleEmail}
              >
                <Mail className="h-4 w-4 text-primary" />
                <span className="truncate">{email}</span>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
