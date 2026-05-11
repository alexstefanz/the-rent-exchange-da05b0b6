import { MoreHorizontal, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  onCancel?: () => void;
  onEarlyReturn?: () => void;
  onReportIssue?: () => void;
}

const SecondaryActionsMenu = ({ onCancel, onEarlyReturn, onReportIssue }: Props) => {
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);

  if (!onCancel && !onEarlyReturn && !onReportIssue) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="bg-white/70">
          <MoreHorizontal className="h-4 w-4 mr-1" />
          {t("Mai multe", "More")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {onEarlyReturn && (
          <DropdownMenuItem onClick={onEarlyReturn}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("Cere retur anticipat", "Request early return")}
          </DropdownMenuItem>
        )}
        {onReportIssue && (
          <DropdownMenuItem onClick={onReportIssue} className="text-destructive focus:text-destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t("Raportează o problemă", "Report a problem")}
          </DropdownMenuItem>
        )}
        {onCancel && (
          <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
            <XCircle className="h-4 w-4 mr-2" />
            {t("Anulează rezervarea", "Cancel rental")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SecondaryActionsMenu;