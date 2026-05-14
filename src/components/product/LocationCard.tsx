import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  address: string;
  city?: string | null;
}

const LocationCard = ({ address, city }: Props) => {
  const { t } = useLanguage();
  const display = address || city || "";
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-5">
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("Locație pickup", "Pickup location")}</h2>
        <div className="flex items-center gap-2 text-sm text-foreground mt-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">{display}</span>
        </div>
      </div>
      <div className="h-[280px] bg-muted">
        <iframe
          width="100%" height="100%" style={{ border: 0 }} loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(display + ", Romania")}&output=embed`}
        />
      </div>
    </div>
  );
};

export default LocationCard;
