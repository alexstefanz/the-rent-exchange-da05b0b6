import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { createOpsTicket } from "@/features/admin/opsTicketsApi";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  rentalId: string;
  rentalPublicId?: string | null;
  productTitle?: string;
  className?: string;
}

const SupportFromRentalButton = ({ rentalId, rentalPublicId, productTitle, className }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast.error(t("Trebuie să fii autentificat", "You must be logged in"));
      return;
    }
    setLoading(true);
    try {
      const refLabel = rentalPublicId || rentalId.slice(0, 8).toUpperCase();
      const ticket = await createOpsTicket({
        title: t(
          `Problemă rezervare ${refLabel}`,
          `Issue with reservation ${refLabel}`,
        ),
        description: t(
          `Am o problemă cu rezervarea ${refLabel}${productTitle ? ` (${productTitle})` : ""}. Vă rog ajutor.`,
          `I have an issue with reservation ${refLabel}${productTitle ? ` (${productTitle})` : ""}. Please help.`,
        ),
        category_group: "RENTAL",
        category_type: "RENTAL_DISPUTE",
        priority: "HIGH",
        requester_user_id: user.id,
        reservation_id: rentalId,
      });
      toast.success(t("Ticket creat", "Ticket created"));
      navigate(`/suport`);
      void ticket;
    } catch (e) {
      console.error(e);
      toast.error(t("Nu am putut crea ticket-ul", "Could not create ticket"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LifeBuoy className="h-4 w-4 mr-1" />}
      {t("Ai o problemă?", "Got an issue?")}
    </Button>
  );
};

export default SupportFromRentalButton;