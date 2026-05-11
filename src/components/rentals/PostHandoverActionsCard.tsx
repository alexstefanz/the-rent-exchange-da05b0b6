import { Lock, MessageCircle, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import EarlyReturnRequestDialog from "./EarlyReturnRequestDialog";

interface Props {
  rentalId: string;
  onChat: () => void;
  onOpenDispute: () => void;
  earlyReturnStatus?: string;
  onEarlyReturnRequested?: () => void;
}

const PostHandoverActionsCard = ({ rentalId, onChat, onOpenDispute, earlyReturnStatus, onEarlyReturnRequested }: Props) => {
  const { t } = useLanguage();
  const isPending = earlyReturnStatus === "pending";
  const wasRejected = earlyReturnStatus === "rejected";

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">
            {t("Rezervarea este activă", "Rental is active")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(
              "Anularea nu mai este posibilă după predarea produsului. Poți discuta cu proprietarul, solicita returnare anticipată sau raporta o problemă.",
              "Cancellation is no longer possible after handover. You can chat with the owner, request an early return, or report an issue.",
            )}
          </p>
          {isPending && (
            <p className="mt-2 text-xs text-amber-700">
              {t("Cerere de returnare anticipată în așteptarea proprietarului.", "Early return request awaiting owner response.")}
            </p>
          )}
          {wasRejected && (
            <p className="mt-2 text-xs text-red-700">
              {t("Proprietarul a refuzat cererea de returnare anticipată.", "Owner rejected the early return request.")}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onChat}>
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              {t("Discută cu proprietarul", "Chat with owner")}
            </Button>

            <EarlyReturnRequestDialog
              rentalId={rentalId}
              onSuccess={onEarlyReturnRequested}
              trigger={
                <Button variant="outline" size="sm" disabled={isPending}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {t("Returnare anticipată", "Early return")}
                </Button>
              }
            />

            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onOpenDispute}
            >
              <ShieldAlert className="h-3.5 w-3.5 mr-1" />
              {t("Raportează o problemă", "Report an issue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostHandoverActionsCard;