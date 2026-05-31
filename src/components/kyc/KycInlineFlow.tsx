import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Upload,
  Camera,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Image as ImageIcon,
  Phone,
  ArrowRight,
  User as UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PhoneRequiredGate, PhoneRequiredDialog, usePhoneRequired } from "@/components/profile/PhoneRequiredGate";
import { useUxCopy } from "@/hooks/useUxCopy";

type KycCase = {
  id: string;
  status: string;
  level_required: string;
  rejection_reason: string | null;
  public_id: string;
  created_at: string;
};

type UploadedDoc = {
  type: "id_front" | "id_back" | "selfie";
  file: File;
  preview: string;
};

const DOC_LABELS = {
  id_front: { ro: "Față buletin / CI", en: "ID Card Front" },
  id_back: { ro: "Verso buletin / CI", en: "ID Card Back" },
  selfie: { ro: "Selfie cu documentul", en: "Selfie with document" },
};

interface KycInlineFlowProps {
  /** "page" renders the section description; "inline" omits it (parent provides context). */
  variant?: "page" | "inline";
}

export const KycInlineFlow = ({ variant = "page" }: KycInlineFlowProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ux = useUxCopy();

  const [kycCase, setKycCase] = useState<KycCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<"id_front" | "id_back" | "selfie" | null>(null);
  const phoneGate = usePhoneRequired();
  const [fullName, setFullName] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  // Validation: trim, min 2 words each >=2 chars, letters/space/hyphen/apostrophe, max 100
  const NAME_REGEX = /^[A-Za-zĂÂÎȘȚăâîșțĂÂÎŞŢăâîşţ' -]+$/;
  const validateName = (raw: string): boolean => {
    const v = raw.trim();
    if (v.length < 4 || v.length > 100) return false;
    if (!NAME_REGEX.test(v)) return false;
    const parts = v.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return false;
    return parts.every((p) => p.replace(/['-]/g, "").length >= 2);
  };
  const isNameValid = validateName(fullName);

  // Load existing full_name from profile
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const v = (data?.full_name || "").trim();
      setFullName(v);
      setInitialFullName(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Load existing KYC case
  const refreshKycCase = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("kyc_cases")
      .select("id, status, level_required, rejection_reason, public_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) console.error("Error loading KYC case:", error);
    setKycCase(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refreshKycCase();
  }, [user, refreshKycCase]);

  // Realtime: reflect admin approval/rejection without page refresh
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`kyc-cases-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kyc_cases",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshKycCase();
          queryClient.invalidateQueries({ queryKey: ["kycGate", user.id] });
          queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, refreshKycCase]);

  useEffect(() => {
    if (!user?.id) return;
    if (kycCase?.status === "APPROVED" || kycCase?.status === "VERIFIED") {
      queryClient.invalidateQueries({ queryKey: ["kycGate", user.id] });
    }
  }, [kycCase?.status, user?.id, queryClient]);

  const handleFileSelect = (docType: "id_front" | "id_back" | "selfie") => {
    setActiveDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocType) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("Eroare", "Error"),
        description: t("Fișierul este prea mare (max 10MB)", "File is too large (max 10MB)"),
        variant: "destructive",
      });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: t("Eroare", "Error"),
        description: t("Format invalid. Acceptăm doar JPG, PNG sau WebP.", "Invalid format. Only JPG, PNG or WebP accepted."),
        variant: "destructive",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setDocs((prev) => {
      const filtered = prev.filter((d) => d.type !== activeDocType);
      return [...filtered, { type: activeDocType, file, preview }];
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
    setActiveDocType(null);
  };

  const removeDoc = (type: string) => {
    setDocs((prev) => {
      const doc = prev.find((d) => d.type === type);
      if (doc) URL.revokeObjectURL(doc.preview);
      return prev.filter((d) => d.type !== type);
    });
  };

  const getDoc = (type: string) => docs.find((d) => d.type === type);

  const allDocsUploaded = !!(getDoc("id_front") && getDoc("id_back") && getDoc("selfie"));

  const handleSubmit = async () => {
    if (!user || !allDocsUploaded) return;
    if (!phoneGate.requirePhone()) return;
    if (!isNameValid) {
      setNameTouched(true);
      toast({
        title: t("Nume invalid", "Invalid name"),
        description: t(
          "Te rugăm să introduci numele complet așa cum apare pe buletin.",
          "Please enter your full name as it appears on your ID."
        ),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const trimmedName = fullName.trim();
      if (trimmedName !== initialFullName) {
        const { error: nameErr } = await supabase
          .from("profiles")
          .update({ full_name: trimmedName })
          .eq("id", user.id);
        if (nameErr) throw nameErr;
        setInitialFullName(trimmedName);
      }

      let caseId = kycCase?.id;

      if (!caseId || kycCase?.status === "REJECTED") {
        const { data: newCase, error: caseErr } = await supabase
          .from("kyc_cases")
          .insert({
            user_id: user.id,
            status: "IN_PROGRESS",
            level_required: "LEVEL_1",
            user_role: "RENTER",
            attempts_count: kycCase?.status === "REJECTED" ? 2 : 1,
          })
          .select("id, status, level_required, rejection_reason, public_id, created_at")
          .single();

        if (caseErr) throw caseErr;
        caseId = newCase.id;
        setKycCase(newCase);
      } else {
        if (kycCase?.status !== "IN_PROGRESS") {
          await supabase.from("kyc_cases").update({ status: "IN_PROGRESS" }).eq("id", caseId);
        }
        await supabase.from("kyc_documents").delete().eq("kyc_case_id", caseId);
      }

      for (const doc of docs) {
        const ext = doc.file.name.split(".").pop();
        const filePath = `${user.id}/${caseId}/${doc.type}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("kyc-documents")
          .upload(filePath, doc.file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(filePath);

        await supabase.from("kyc_documents").insert({
          kyc_case_id: caseId,
          document_type: doc.type,
          file_url: urlData.publicUrl || filePath,
          file_name: `${doc.type}.${ext}`,
          file_size: doc.file.size,
          mime_type: doc.file.type,
          uploaded_by_user_id: user.id,
        });
      }

      const { data: updated } = await supabase
        .from("kyc_cases")
        .update({ status: "SUBMITTED", submitted_at: new Date().toISOString() })
        .eq("id", caseId)
        .select("id, status, level_required, rejection_reason, public_id, created_at")
        .single();

      if (updated) setKycCase(updated);

      await supabase.from("profiles").update({ kyc_status: "SUBMITTED" }).eq("id", user.id);

      // Fire-and-forget: extract ID card data via Lovable AI (non-blocking)
      supabase.functions
        .invoke("extract-id-data", { body: { kyc_case_id: caseId } })
        .catch((e) => console.warn("[extract-id-data] failed:", e));

      docs.forEach((d) => URL.revokeObjectURL(d.preview));
      setDocs([]);

      // Refresh profile-driven gates everywhere (AccountTab, drawer, etc.)
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });

      toast({
        title: t("Succes!", "Success!"),
        description: t(
          "Documentele au fost trimise. Verificarea durează de obicei 1-2 zile lucrătoare.",
          "Documents submitted. Verification usually takes 1-2 business days."
        ),
      });
    } catch (error: any) {
      console.error("KYC submit error:", error);
      toast({
        title: t("Eroare", "Error"),
        description: error.message || t("Nu s-au putut trimite documentele", "Could not submit documents"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadySubmitted = kycCase?.status === "SUBMITTED" || kycCase?.status === "NEEDS_MANUAL_REVIEW";
  const isVerified = kycCase?.status === "VERIFIED" || kycCase?.status === "APPROVED";
  const isRejected = kycCase?.status === "REJECTED";
  const canUpload = !isAlreadySubmitted && !isVerified;
  const showPhoneGate = canUpload && !phoneGate.isProfileLoading && !phoneGate.hasValidPhone;

  const progress = isVerified ? 100 : isAlreadySubmitted ? 66 : docs.length > 0 ? 33 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {variant === "page" && (
        <p className="text-sm text-muted-foreground">
          {t(
            "Verificarea identității crește încrederea și securitatea pe platformă.",
            "Identity verification increases trust and security on the platform."
          )}
        </p>
      )}

      <PhoneRequiredGate />
      <PhoneRequiredDialog open={phoneGate.dialogOpen} onOpenChange={phoneGate.setDialogOpen} />

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{t("Încărcare documente", "Upload documents")}</span>
          <span>{t("În verificare", "Under review")}</span>
          <span>{t("Verificat", "Verified")}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {isVerified && (
        <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                {t("Identitate verificată!", "Identity verified!")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Contul tău este complet verificat. Bucură-te de toate funcționalitățile!",
                  "Your account is fully verified. Enjoy all features!"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isAlreadySubmitted && (
        <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-8 w-8 text-amber-500 flex-shrink-0 animate-spin" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                {t("Verificare în curs", "Verification in progress")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Documentele tale sunt analizate de echipa noastră. Vei fi notificat când procesul este finalizat (1-2 zile lucrătoare).",
                  "Your documents are being reviewed by our team. You'll be notified when the process is complete (1-2 business days)."
                )}
              </p>
              {kycCase?.public_id && (
                <Badge variant="outline" className="mt-2">
                  {kycCase.public_id}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">
                {t("Verificarea a fost respinsă", "Verification was rejected")}
              </p>
              {kycCase?.rejection_reason && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t("Motiv", "Reason")}: {kycCase.rejection_reason}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {t(
                  "Te rugăm să reîncarci documentele corecte mai jos.",
                  "Please re-upload the correct documents below."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {showPhoneGate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center text-center gap-4 py-10 px-6">
            <div className="rounded-full bg-primary/15 p-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-lg font-semibold text-foreground">{ux.smsNotifications.kycGateTitle}</h2>
              <p className="text-sm text-muted-foreground">{ux.smsNotifications.kycGateDesc}</p>
            </div>
            <Button onClick={() => navigate("/contul-meu")}>
              {ux.smsNotifications.kycGateCta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {canUpload && !showPhoneGate && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t("Documente necesare", "Required documents")}
              </CardTitle>
              <CardDescription>
                {t(
                  "Încarcă fotografii clare ale documentului tău de identitate (buletin sau carte de identitate) și un selfie.",
                  "Upload clear photos of your identity document (ID card) and a selfie."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {(["id_front", "id_back", "selfie"] as const).map((type) => {
                const doc = getDoc(type);
                const label = DOC_LABELS[type];
                const Icon = type === "selfie" ? Camera : ImageIcon;

                return (
                  <div
                    key={type}
                    className="rounded-lg border border-dashed border-border p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {doc ? (
                          <FileCheck className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{t(label.ro, label.en)}</p>
                          {doc && (
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.file.name} ({(doc.file.size / 1024).toFixed(0)} KB)
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeDoc(type)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={doc ? "outline" : "default"}
                          onClick={() => handleFileSelect(type)}
                        >
                          {doc ? t("Schimbă", "Change") : t("Încarcă", "Upload")}
                        </Button>
                      </div>
                    </div>
                    {doc && (
                      <div className="mt-3">
                        <img
                          src={doc.preview}
                          alt={t(label.ro, label.en)}
                          className="h-32 w-auto rounded-md object-cover border"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <p className="text-sm font-medium mb-2">
                {t("Sfaturi pentru o verificare rapidă:", "Tips for a quick verification:")}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("Fotografiile trebuie să fie clare și bine iluminate", "Photos must be clear and well-lit")}</li>
                <li>{t("Toate datele de pe document trebuie să fie lizibile", "All data on the document must be readable")}</li>
                <li>
                  {t(
                    "Selfie-ul trebuie să arate clar fața ta alături de document",
                    "The selfie must clearly show your face next to the document"
                  )}
                </li>
                <li>{t("Acceptăm buletin, carte de identitate sau pașaport", "We accept ID card or passport")}</li>
              </ul>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={!allDocsUploaded || isSubmitting || !phoneGate.hasValidPhone}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Se trimit documentele...", "Submitting documents...")}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {t("Trimite documentele pentru verificare", "Submit documents for verification")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default KycInlineFlow;