import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Upload,
  Camera,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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

const KycVerification = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [kycCase, setKycCase] = useState<KycCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<"id_front" | "id_back" | "selfie" | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load existing KYC case
  useEffect(() => {
    if (!user) return;
    const load = async () => {
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
    };
    load();
  }, [user]);

  // Proactively invalidate KYC gate cache when case is approved/verified
  // so booking components (BookingCard, Checkout) pick up the latest status
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

  const allDocsUploaded = getDoc("id_front") && getDoc("id_back") && getDoc("selfie");

  const handleSubmit = async () => {
    if (!user || !allDocsUploaded) return;
    setIsSubmitting(true);

    try {
      // 1. Create or reuse KYC case
      let caseId = kycCase?.id;

      if (!caseId || kycCase?.status === "REJECTED") {
        const { data: newCase, error: caseErr } = await supabase
          .from("kyc_cases")
          .insert({
            user_id: user.id,
            status: "IN_PROGRESS",
            level_required: "LEVEL_1",
            user_role: "RENTER",
            attempts_count: (kycCase?.status === "REJECTED" ? 2 : 1),
          })
          .select("id, status, level_required, rejection_reason, public_id, created_at")
          .single();

        if (caseErr) throw caseErr;
        caseId = newCase.id;
        setKycCase(newCase);
      } else {
        // Force existing case to IN_PROGRESS so RLS allows document upload
        // (covers NOT_STARTED, IN_PROGRESS, SUBMITTED re-uploads)
        if (kycCase?.status !== "IN_PROGRESS") {
          await supabase
            .from("kyc_cases")
            .update({ status: "IN_PROGRESS" })
            .eq("id", caseId);
        }

        // Clean up any previous documents on this case to avoid duplicates
        await supabase.from("kyc_documents").delete().eq("kyc_case_id", caseId);
      }

      // 2. Upload files to storage
      for (const doc of docs) {
        const ext = doc.file.name.split(".").pop();
        const filePath = `${user.id}/${caseId}/${doc.type}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("kyc-documents")
          .upload(filePath, doc.file, { upsert: true });

        if (uploadErr) throw uploadErr;

        // 3. Record in kyc_documents table
        const { data: urlData } = supabase.storage
          .from("kyc-documents")
          .getPublicUrl(filePath);

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

      // 4. Update case to SUBMITTED
      const { data: updated } = await supabase
        .from("kyc_cases")
        .update({ status: "SUBMITTED", submitted_at: new Date().toISOString() })
        .eq("id", caseId)
        .select("id, status, level_required, rejection_reason, public_id, created_at")
        .single();

      if (updated) setKycCase(updated);

      // 5. Update profile kyc_status
      await supabase
        .from("profiles")
        .update({ kyc_status: "SUBMITTED" })
        .eq("id", user.id);

      // Clean up previews
      docs.forEach((d) => URL.revokeObjectURL(d.preview));
      setDocs([]);

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

  const progress = isVerified ? 100 : isAlreadySubmitted ? 66 : docs.length > 0 ? 33 : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8 px-4 pt-20 lg:pt-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/profile#contul-meu")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Înapoi la cont", "Back to account")}
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t("Verificare identitate", "Identity Verification")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(
              "Verificarea identității crește încrederea și securitatea pe platformă.",
              "Identity verification increases trust and security on the platform."
            )}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{t("Încărcare documente", "Upload documents")}</span>
            <span>{t("În verificare", "Under review")}</span>
            <span>{t("Verificat", "Verified")}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Already verified */}
        {isVerified && (
          <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
            <CardContent className="flex items-center gap-3 py-6">
              <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  {t("Identitate verificată!", "Identity verified!")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Contul tău este complet verificat. Bucură-te de toate funcționalitățile!", "Your account is fully verified. Enjoy all features!")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submitted / Under review */}
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
                  <Badge variant="outline" className="mt-2">{kycCase.public_id}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected */}
        {isRejected && (
          <Card className="border-destructive/30 bg-destructive/5 mb-6">
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
                  {t("Te rugăm să reîncarci documentele corecte mai jos.", "Please re-upload the correct documents below.")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload section */}
        {canUpload && (
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {doc ? (
                            <FileCheck className="h-5 w-5 text-green-500" />
                          ) : (
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{t(label.ro, label.en)}</p>
                            {doc && (
                              <p className="text-xs text-muted-foreground">
                                {doc.file.name} ({(doc.file.size / 1024).toFixed(0)} KB)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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

            {/* Tips */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-2">{t("Sfaturi pentru o verificare rapidă:", "Tips for a quick verification:")}</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t("Fotografiile trebuie să fie clare și bine iluminate", "Photos must be clear and well-lit")}</li>
                  <li>{t("Toate datele de pe document trebuie să fie lizibile", "All data on the document must be readable")}</li>
                  <li>{t("Selfie-ul trebuie să arate clar fața ta alături de document", "The selfie must clearly show your face next to the document")}</li>
                  <li>{t("Acceptăm buletin, carte de identitate sau pașaport", "We accept ID card or passport")}</li>
                </ul>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              disabled={!allDocsUploaded || isSubmitting}
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
      </main>
      <Footer />
    </div>
  );
};

export default KycVerification;
