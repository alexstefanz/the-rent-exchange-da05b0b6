import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const withdrawalSchema = z.object({
  amount: z.number().positive("Suma trebuie să fie pozitivă"),
  iban: z.string().min(15, "IBAN invalid").max(34, "IBAN prea lung").regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, "Format IBAN invalid"),
  account_holder: z.string().min(2, "Numele titularului este obligatoriu").max(100),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  defaultIban?: string;
  defaultAccountHolder?: string;
  onSuccess: () => void;
}

const WithdrawalDialog = ({ open, onOpenChange, availableBalance, defaultIban, defaultAccountHolder, onSuccess }: WithdrawalDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      iban: defaultIban || "",
      account_holder: defaultAccountHolder || "",
    },
  });

  const handleSubmit = async (data: WithdrawalFormData) => {
    if (!user) return;
    if (data.amount > availableBalance) {
      form.setError("amount", { message: t("Suma depășește balanța disponibilă", "Amount exceeds available balance") });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawal_requests" as any).insert({
        user_id: user.id,
        amount: data.amount,
        iban: data.iban.toUpperCase(),
        account_holder: data.account_holder,
      });

      if (error) throw error;

      // Save IBAN to profile for future use
      await supabase.from("profiles").update({
        iban: data.iban.toUpperCase(),
        account_holder_name: data.account_holder,
      } as any).eq("id", user.id);

      toast({
        title: t("Cerere trimisă", "Request sent"),
        description: t("Cererea de retragere a fost trimisă. Vei fi notificat când este procesată.", "Withdrawal request sent. You'll be notified when it's processed."),
      });
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: t("Eroare", "Error"),
        description: t("Nu s-a putut trimite cererea de retragere", "Could not send withdrawal request"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Retrage bani", "Withdraw funds")}</DialogTitle>
          <DialogDescription>
            {t("Balanță disponibilă", "Available balance")}: <strong>{availableBalance.toFixed(2)} RON</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("Sumă (RON)", "Amount (RON)")}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              max={availableBalance}
              placeholder="0.00"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              placeholder="RO49AAAA1B31007593840000"
              maxLength={34}
              {...form.register("iban", { onChange: (e) => { e.target.value = e.target.value.toUpperCase().replace(/\s/g, ""); } })}
            />
            {form.formState.errors.iban && <p className="text-sm text-destructive">{form.formState.errors.iban.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder">{t("Titular cont", "Account holder")}</Label>
            <Input id="account_holder" placeholder="Ion Popescu" maxLength={100} {...form.register("account_holder")} />
            {form.formState.errors.account_holder && <p className="text-sm text-destructive">{form.formState.errors.account_holder.message}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Anulează", "Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || availableBalance <= 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Trimite cererea", "Submit request")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalDialog;
