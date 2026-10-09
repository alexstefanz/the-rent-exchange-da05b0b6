import { PhoneRequiredDialog, usePhoneRequired } from "@/components/profile/PhoneRequiredGate";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  Plus,
  Truck,
  MapPin,
  Calendar as CalendarIcon,
  Check,
  Image as ImageIcon,
  Tag,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ListItemsInput } from "@/components/publish/ListItemsInput";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createProduct,
  updateProduct,
  getOwnerProductCount,
  calculateClientPrice,
  type Product,
} from "@/features/products/productsApi";
import { calcPlatformFee } from "@/lib/rentalPricing";
import { categories } from "@/data/categories";
import { getCategoryIcon } from "@/data/categoryIcons";
import { judete } from "@/data/romaniaLocations";
import {
  emptyPublishForm,
  CONDITION_LABELS,
  DEFAULT_USAGE_RULES,
  DEFAULT_USAGE_RULES_I18N,
  stepValidators,
  type PublishFormData,
  type ProductCondition,
  type DepositType,
  type MinRentalPreset,
} from "@/lib/publishTypes";
import { computeQualityScore } from "@/lib/qualityScore";
import { upsertDraft, deleteDraft, getActiveDraft } from "@/features/publish/draftsApi";
import { getSimilarPricing, type SimilarPricing } from "@/features/publish/pricingBenchmarkApi";
import ImageUpload from "@/components/products/ImageUpload";
import LivePreviewCard from "./LivePreviewCard";
import QualityScoreCard from "./QualityScoreCard";
import PublishStepper, { type StepDef } from "./PublishStepper";
import PublishTopBar from "./PublishTopBar";
import PublishFooter from "./PublishFooter";
import { cn } from "@/lib/utils";
import { getProductUrl } from "@/lib/slugUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const buildSteps = (t: (ro: string, en: string) => string): StepDef[] => [
  { id: 1, label: t("Categorie", "Category"), shortLabel: t("Categorie", "Category") },
  { id: 2, label: t("Fotografii & detalii", "Photos & details"), shortLabel: t("Detalii", "Details") },
  { id: 3, label: t("Locație & Preț", "Location & Price"), shortLabel: t("Locație & Preț", "Location & Price") },
  { id: 4, label: t("Verificare & publicare", "Review & publish"), shortLabel: t("Publică", "Publish") },
];

interface Props {
  mode: "create" | "edit";
  productId?: string;
  initialProduct?: Product | null;
}

const PublishWizard = ({ mode, productId, initialProduct }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const STEPS = useMemo(() => buildSteps(t), [t, language]);
  const queryClient = useQueryClient();
  const phoneGate = usePhoneRequired();
  const [publishError, setPublishError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  // In edit mode, true while user is editing one section from the Summary;
  // next/save returns to Summary instead of advancing to the next step.
  const [editingFromSummary, setEditingFromSummary] = useState(false);
  const [data, setData] = useState<PublishFormData>(() => {
    if (initialProduct) {
      const p = initialProduct as any;
      const matchedCounty =
        judete.find((j) => j.localitati.includes(p.location_city || ""))?.name || "";
      return {
        ...emptyPublishForm(),
        category: p.category || "",
        subcategory: p.subcategory || "",
        title: p.title || "",
        description: p.description || "",
        condition: (p.condition as ProductCondition) || "",
        included_items: p.included_items || [],
        usage_rules: p.usage_rules || [],
        serial_number: p.serial_number || "",
        images: p.images || [],
        location_county: matchedCounty,
        location_city: p.location_city || "",
        pickup_address: p.pickup_address || "",
        pickup_lat: p.pickup_lat ?? null,
        pickup_lng: p.pickup_lng ?? null,
        pickup_available: p.pickup_available ?? true,
        delivery_available: p.delivery_available ?? false,
        delivery_fee: p.delivery_fee ?? null,
        delivery_radius_km: p.delivery_radius_km ?? null,
        daily_price_owner: p.daily_price_owner ?? null,
        deposit_type: (p.deposit_type as DepositType) || "none",
        deposit_value: p.deposit_value ?? null,
        min_rental_preset: (p.min_rental_preset as MinRentalPreset) || "1_day",
        min_rental_days: p.min_rental_days ?? 1,
        max_rental_days: p.max_rental_days ?? null,
        available_immediately: p.available_immediately ?? true,
        blocked_dates: p.blocked_dates || [],
        is_active: p.is_active ?? true,
      };
    }
    return emptyPublishForm();
  });

  const [feePercent, setFeePercent] = useState(15);
  const [freeListingsLeft, setFreeListingsLeft] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDraft, setPendingDraft] = useState<{
    id: string;
    payload: PublishFormData;
    step: number;
    updated_at: string;
  } | null>(null);

  // Edit mode: land directly on the Summary step so the user can jump to any
  // section instead of re-walking the whole wizard.
  useEffect(() => {
    if (mode === "edit" && initialProduct) {
      setStep(4);
      setMaxReached(4);
    }
    // run once when the product is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct?.id, mode]);

  // load fee
  useEffect(() => {
    if (!user) return;
    if (mode === "edit") return;
    getOwnerProductCount(user.id).then((count) => {
      const free = Math.max(0, 3 - count);
      setFreeListingsLeft(free);
      setFeePercent(count < 3 ? 0 : 15);
    });
  }, [user, mode]);

  // load draft (create mode only)
  useEffect(() => {
    if (!user || mode === "edit") return;
    getActiveDraft(user.id, null).then((d) => {
      if (!d) return;
      const payload = d.payload as PublishFormData;
      const isEmpty =
        !payload?.title &&
        !payload?.category &&
        (!payload?.images || payload.images.length === 0);
      if (isEmpty) {
        // silently discard empty/ghost drafts
        deleteDraft(d.id).catch(() => {});
        return;
      }
      try {
        const dismissed = localStorage.getItem("publish:draftPromptDismissed");
        if (dismissed === d.id) {
          setDraftId(d.id);
          return;
        }
      } catch {}
      setPendingDraft({
        id: d.id,
        payload,
        step: d.step || 1,
        updated_at: d.updated_at,
      });
    });
  }, [user, mode]);

  // autosave draft (create mode only)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || mode === "edit") return;
    if (pendingDraft) return; // wait for user's choice
    if (!data.title && !data.category && data.images.length === 0) return;
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const id = await upsertDraft(user.id, null, data, step, draftId ?? undefined);
      if (id) setDraftId(id);
      setLastSavedAt(new Date());
      setSaveStatus("saved");
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, step, user, mode, draftId, pendingDraft]);

  const handleContinueDraft = () => {
    if (!pendingDraft) return;
    try { localStorage.setItem("publish:draftPromptDismissed", pendingDraft.id); } catch {}
    setDraftId(pendingDraft.id);
    setData({ ...emptyPublishForm(), ...pendingDraft.payload });
    const target = Math.min(Math.max(pendingDraft.step || 1, 1), 4);
    setStep(target);
    setMaxReached(target);
    setPendingDraft(null);
  };

  const handleStartFresh = async () => {
    if (!pendingDraft) return;
    try { localStorage.setItem("publish:draftPromptDismissed", pendingDraft.id); } catch {}
    setDraftId(null);
    setPendingDraft(null);
  };

  const handleDeleteDraft = async () => {
    if (!pendingDraft) return;
    try {
      await deleteDraft(pendingDraft.id);
      try { localStorage.removeItem("publish:draftPromptDismissed"); } catch {}
      toast({
        title: t("Draft șters", "Draft deleted"),
        description: t("Draftul a fost eliminat definitiv.", "The draft has been removed permanently."),
      });
    } catch {
      toast({
        title: t("Eroare la ștergere", "Delete failed"),
        variant: "destructive",
      });
    }
    setDraftId(null);
    setPendingDraft(null);
  };

  const update = <K extends keyof PublishFormData>(key: K, value: PublishFormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const validateStep = (s: number): boolean => {
    const validators: Record<number, () => any> = {
      1: () => {
        const catRes = stepValidators.step1.safeParse({ category: data.category });
        if (!catRes.success) return catRes;
        const cat = categories.find((c) => c.name === data.category);
        if (cat && cat.subcategories.length > 0 && !data.subcategory) {
          return {
            success: false,
            error: { errors: [{ path: ["subcategory"], message: t("Selectează o subcategorie", "Select a subcategory") }] },
          };
        }
        return { success: true };
      },
      2: () => {
        const detailsRes = stepValidators.step2.safeParse({
          title: data.title,
          description: data.description,
          condition: data.condition,
        });
        if (!detailsRes.success) return detailsRes;
        return stepValidators.step3.safeParse({ images: data.images });
      },
      3: () => {
        const locRes = stepValidators.step4.safeParse({
          location_county: data.location_county,
          location_city: data.location_city,
        });
        if (!locRes.success) return locRes;
        return stepValidators.step5.safeParse({ daily_price_owner: data.daily_price_owner });
      },
      4: () => ({ success: true }),
    };
    const result = validators[s]();
    if (!result.success) {
      const flat: Record<string, string> = {};
      result.error?.errors?.forEach((e: any) => {
        flat[e.path[0]] = e.message;
      });
      setErrors(flat);
      const firstMsg = Object.values(flat)[0];
      if (flat.subcategory) {
        toast({
          title: t("Alege o subcategorie", "Pick a subcategory"),
          description: t(
            "Te rugăm să alegi și o subcategorie din lista de mai jos înainte de a continua.",
            "Please also pick a subcategory from the list below before continuing.",
          ),
          variant: "destructive",
        });
        setTimeout(() => {
          document
            .getElementById("subcategory-section")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      } else if (firstMsg) {
        toast({ title: t("Verifică datele", "Check the details"), description: firstMsg, variant: "destructive" });
      }
      return false;
    }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (step === 4) {
      handlePublish();
      return;
    }
    if (!validateStep(step)) return;
    // Edit mode: after editing one section from the Summary, jump back to it.
    if (mode === "edit" && editingFromSummary) {
      setEditingFromSummary(false);
      setStep(4);
      setMaxReached((m) => Math.max(m, 4));
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    const next = step + 1;
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const goBack = () => {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const jump = (s: number) => {
    if (s <= maxReached) {
      // If we jump out from the Summary into an earlier step (edit mode),
      // remember so that "Continuă" returns to the Summary after saving.
      if (mode === "edit" && step === 4 && s !== 4) setEditingFromSummary(true);
      if (s === 4) setEditingFromSummary(false);
      setStep(s);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  };

  const handleExit = () => {
    toast({
      title:
        mode === "create"
          ? t("Draftul tău este salvat", "Your draft has been saved")
          : t("Modificările nesalvate au fost păstrate local", "Unsaved changes have been kept locally"),
    });
    navigate("/owner");
  };

  const canPreview = !!data.title && !!data.category && (data.images?.length ?? 0) > 0;

  const handlePreview = () => {
    if (!canPreview || !user) return;
    if (mode === "edit" && initialProduct) {
      const url = `${getProductUrl(initialProduct)}?preview=1`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      sessionStorage.setItem(
        "publish:preview",
        JSON.stringify({ data, feePercent, ownerId: user.id, savedAt: Date.now() }),
      );
      window.open("/publica/previzualizare", "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: t("Eroare", "Error"),
        description: t(
          "Nu am putut deschide previzualizarea. Încearcă din nou.",
          "Couldn't open the preview. Please try again.",
        ),
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    setPublishError(null);
    if (!user) {
      setPublishError(t("Sesiunea a expirat. Autentifică-te din nou.", "Session expired. Please sign in again."));
      return;
    }
    // Validate critical steps
    for (let s = 1; s <= 3; s++) {
      if (!validateStep(s)) {
        setPublishError(t("Unele informații lipsesc sau nu sunt valide. Verifică pasul afișat.", "Some details are missing or invalid. Check the step shown."));
        setStep(s);
        return;
      }
    }
    setIsPublishing(true);
    try {
      const quality = computeQualityScore(data).total;
      const payload = {
        title: data.title,
        description: data.description,
        daily_price_owner: data.daily_price_owner!,
        category: data.category,
        subcategory: data.subcategory,
        location_city: data.location_city,
        location_country: "Romania",
        pickup_address: data.pickup_address,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        pickup_available: data.pickup_available,
        delivery_available: data.delivery_available,
        delivery_fee: data.delivery_fee,
        delivery_radius_km: data.delivery_radius_km,
        images: data.images,
        included_items: data.included_items,
        usage_rules: data.usage_rules,
        condition: data.condition || null,
        deposit_type: data.deposit_type,
        deposit_value: data.deposit_value,
        min_rental_days: data.min_rental_days,
        min_rental_preset: data.min_rental_preset,
        max_rental_days: data.max_rental_days,
        available_immediately: data.available_immediately,
        blocked_dates: data.blocked_dates,
        quality_score: quality,
        serial_number: data.serial_number || null,
      };

      if (mode === "edit" && productId) {
        const prevStatus = initialProduct?.approval_status;
        const willRequireReview = prevStatus === "rejected" || prevStatus === "approved";
        await updateProduct(productId, { ...payload, is_active: data.is_active }, user.id);
        await queryClient.invalidateQueries({ queryKey: ["my-products", user.id] });
        await queryClient.invalidateQueries({ queryKey: ["product", productId] });
        toast({
          title: willRequireReview
            ? t("Anunț retrimis spre aprobare", "Listing resubmitted for approval")
            : t("Anunț actualizat", "Listing updated"),
          description: prevStatus === "approved"
            ? t(
                "Anunțul rămâne activ cu datele actuale până la verificarea modificărilor.",
                "Your listing stays live with the current details until the changes are reviewed.",
              )
            : willRequireReview
            ? t(
                "Îl vei vedea publicat după verificare (de obicei sub 2 ore).",
                "It will be published after review (usually under 2 hours).",
              )
            : t("Modificările au fost salvate.", "Your changes have been saved."),
        });
        navigate("/owner");
      } else {
        await createProduct(payload, user.id);
        if (draftId) await deleteDraft(draftId);
        toast({
          title: t("Anunț trimis spre aprobare", "Listing submitted for approval"),
          description: t(
            "Vei primi o notificare când e aprobat (uzual sub 2 ore).",
            "You'll get a notification once it's approved (usually under 2 hours).",
          ),
        });
        navigate("/owner");
      }
    } catch (err: any) {
      console.error(err);
      const raw = String(err?.message || "");
      setPublishError(
        raw.includes("PHONE_NOT_VERIFIED")
          ? t("Trebuie să îți verifici numărul de telefon înainte de a publica.", "Verify your phone number before publishing.")
          : `${t("Anunțul nu a putut fi publicat", "The listing could not be published")}: ${raw || t("încearcă din nou.", "please try again.")}`,
      );
      toast({
        title: t("Eroare la publicare", "Publish error"),
        description: err?.message || t("Încearcă din nou.", "Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedCat = categories.find((c) => c.name === data.category);

  if (phoneGate.phoneLoaded && !phoneGate.hasValidPhone && !phoneGate.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Verifică numărul de telefon</h1>
        <p className="mt-2 text-muted-foreground">Pentru a publica un anunț ai nevoie de un număr de telefon verificat prin SMS.</p>
        <Button className="mt-6" onClick={() => phoneGate.setDialogOpen(true)}>Verifică acum</Button>
        <PhoneRequiredDialog open={phoneGate.dialogOpen} onOpenChange={phoneGate.setDialogOpen} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublishTopBar
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onExit={handleExit}
        mode={mode}
        onPreview={handlePreview}
        canPreview={canPreview}
      />
      <PublishStepper steps={STEPS} current={step} maxReached={maxReached} onJump={jump} />

      <main className="flex-1">
        <div
          className={cn(
            "mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:px-6",
            step >= 2 && "lg:grid-cols-[1fr_360px]",
          )}
        >
          <div className="min-w-0">
            {step === 1 && <Step1Category data={data} update={update} errors={errors} />}
            {step === 2 && user && (
              <Step2Details data={data} update={update} errors={errors} feePercent={feePercent} userId={user.id} />
            )}
            {step === 3 && (
              <div className="space-y-10">
                <Step4Location data={data} update={update} errors={errors} />
                <Step5Pricing data={data} update={update} feePercent={feePercent} freeListingsLeft={freeListingsLeft} errors={errors} />
              </div>
            )}
            {step === 4 && (
              <>
                {mode === "edit" && initialProduct?.approval_status === "approved" && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                      {t(
                        "Orice modificare salvată va trimite anunțul din nou spre aprobare. Anunțul nu va fi vizibil public până la o nouă verificare (de obicei sub 2 ore).",
                        "Saving any change will resubmit the listing for review. It won't be publicly visible until re-approved (usually under 2 hours).",
                      )}
                    </p>
                  </div>
                )}
                <Step6Review data={data} feePercent={feePercent} onJump={jump} mode={mode} />
              </>
            )}
          </div>

          {step >= 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("Previzualizare live", "Live preview")}
                </p>
                <LivePreviewCard data={data} feePercent={feePercent} />
                <QualityScoreCard data={data} />
              </div>
            </aside>
          )}
        </div>
      </main>

      <PublishFooter
        current={step}
        total={STEPS.length}
        onBack={goBack}
        onNext={goNext}
        isLoading={isPublishing}
        error={publishError}
        isFinal={step === STEPS.length}
        nextLabel={
          mode === "edit" && editingFromSummary && step !== 4
            ? t("Salvează și înapoi la rezumat", "Save and back to summary")
            : undefined
        }
        secondaryAction={
          mode === "edit" && editingFromSummary && step !== 4
            ? { label: t("Anulează și înapoi la rezumat", "Cancel and back to summary"), onClick: () => { setEditingFromSummary(false); setStep(4); window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); } }
            : undefined
        }
      />

      <AlertDialog open={!!pendingDraft}>
        <AlertDialogContent>
          <button
            type="button"
            onClick={() => {
              if (pendingDraft) {
                try { localStorage.setItem("publish:draftPromptDismissed", pendingDraft.id); } catch {}
                setDraftId(pendingDraft.id);
              }
              setPendingDraft(null);
            }}
            aria-label={t("Închide", "Close")}
            className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Ai un anunț nesalvat", "You have an unsaved listing")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t("Am găsit un draft început anterior. Vrei să continui de unde ai rămas sau să începi un anunț nou?", "We found a draft you started earlier. Do you want to continue where you left off or start a new listing?")}</p>
                {pendingDraft && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-foreground">
                    <p className="font-semibold">
                      {pendingDraft.payload.title?.trim() || t("Anunț fără titlu", "Untitled listing")}
                    </p>
                    {pendingDraft.payload.category && (
                      <p className="text-xs text-muted-foreground">{pendingDraft.payload.category}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("Ultima modificare:", "Last modified:")}{" "}
                      {new Date(pendingDraft.updated_at).toLocaleString(language === "en" ? "en-US" : "ro-RO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteDraft}
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {t("Șterge draftul", "Delete draft")}
            </AlertDialogCancel>
            <AlertDialogCancel onClick={handleStartFresh}>{t("Începe anunț nou", "Start new listing")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueDraft}>{t("Continuă draftul", "Continue draft")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PublishWizard;

/* ----------------------------------- STEP 1 ----------------------------------- */

const Step1Category = ({
  data,
  update,
  errors,
}: {
  data: PublishFormData;
  update: <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;
  errors: Record<string, string>;
}) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subcategories.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [search]);
  const selectedCat = categories.find((c) => c.name === data.category);

  return (
    <div>
      <StepHeader
        eyebrow={t("Pasul 1 din 4", "Step 1 of 4")}
        title={t("Ce oferi spre închiriere?", "What do you want to rent out?")}
        subtitle={t(
          "Alege o categorie ca să-ți arătăm câmpurile potrivite și prețul mediu din piață.",
          "Pick a category so we can show you the right fields and average market price.",
        )}
      />

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("Caută categorie (ex: bicicletă, cameră foto, drujbă...)", "Search category (e.g. bike, camera, chainsaw...)")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((cat) => {
            const active = data.category === cat.name;
            const Icon = getCategoryIcon(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  update("category", cat.name);
                  update("subcategory", "");
                }}
                className={cn(
                  "group relative flex h-28 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center transition-all lg:h-24",
                  active
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                )}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <span className={cn("text-xs font-medium leading-tight", active ? "text-primary" : "text-foreground")}>
                  {cat.name}
                </span>
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedCat && selectedCat.subcategories.length > 0 && (
          <div
            id="subcategory-section"
            className={cn(
              "self-start rounded-2xl border bg-card p-5 transition-colors lg:sticky lg:top-24",
              errors.subcategory ? "border-destructive ring-2 ring-destructive/20" : "border-border",
            )}
          >
            <Label className="text-sm font-semibold text-foreground">
              {t("Subcategorie", "Subcategory")} <span className="text-destructive">*</span>
            </Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCat.subcategories.map((sub) => {
                const active = data.subcategory === sub.name;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => update("subcategory", active ? "" : sub.name)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
            {errors.subcategory && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" /> {errors.subcategory}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------- STEP 2 ----------------------------------- */

const Step2Details = ({
  data,
  update,
  errors,
  feePercent: _fee,
  userId,
}: {
  data: PublishFormData;
  update: <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;
  errors: Record<string, string>;
  feePercent: number;
  userId: string;
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  return (
    <div>
      <StepHeader
        eyebrow={t("Pasul 2 din 4", "Step 2 of 4")}
        title={t("Fotografii & detalii", "Photos & details")}
        subtitle={t(
          "Adaugă întâi pozele (6+ recomandat) — apoi completează titlul și descrierea.",
          "Add the photos first (6+ recommended) — then fill in the title and description.",
        )}
      />

      <div className="mt-6 space-y-6">
        {/* Photos */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("Fotografii", "Photos")} <span className="font-normal text-muted-foreground">{t("(prima poză devine coperta)", "(the first photo becomes the cover)")}</span>
          </Label>
          <div className="rounded-2xl border border-border bg-card p-4">
            <ImageUpload userId={userId} images={data.images} onChange={(imgs) => update("images", imgs)} maxImages={10} />
          </div>
          {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{t("Sfaturi pentru poze bune:", "Tips for good photos:")}</p>
                <ul className="list-disc space-y-0.5 pl-4">
                  <li>{t("Lumină naturală, fără bliț", "Natural light, no flash")}</li>
                  <li>{t("Fundal curat, neutru", "Clean, neutral background")}</li>
                  <li>{t("Arată produsul din 3-4 unghiuri + detalii", "Show the product from 3-4 angles + details")}</li>
                  <li>{t("Include accesoriile incluse", "Include the included accessories")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-semibold">
            {t("Titlu anunț", "Listing title")}
          </Label>
          <Input
            id="title"
            placeholder={t("Ex: Bicicletă MTB Trek Marlin 7, mărime L", "E.g. Trek Marlin 7 MTB bike, size L")}
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-12 text-base"
            maxLength={100}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("Folosește brand, model și particularități. Fără date de contact.", "Use brand, model and specifics. No contact info.")}</span>
            <span className={cn(data.title.length > 90 ? "text-amber-600" : "text-muted-foreground")}>{data.title.length}/100</span>
          </div>
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">{t("Starea produsului", "Product condition")}</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map((c) => {
              const active = data.condition === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("condition", c)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {CONDITION_LABELS[c][language]}
                </button>
              );
            })}
          </div>
          {errors.condition && <p className="text-sm text-destructive">{errors.condition}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            {t("Descriere", "Description")}
          </Label>
          <Textarea
            id="description"
            placeholder={t("Descrie pentru ce e potrivit, ce e inclus, particularități sau atenționări...", "Describe what it's good for, what's included, specifics or warnings...")}
            rows={6}
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={2000}
            className="resize-none text-base"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("Min. 60 caractere recomandate. Fără email/telefon/link-uri.", "Min. 60 characters recommended. No email/phone/links.")}</span>
            <span className="text-muted-foreground">{data.description.length}/2000</span>
          </div>
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* Included items */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("Ce este inclus", "What's included")} <span className="font-normal text-muted-foreground">{t("(accesorii)", "(accessories)")}</span>
          </Label>
          <ListItemsInput
            items={data.included_items}
            onChange={(items) => update("included_items", items)}
            placeholder={t("Ex: Husă de transport", "E.g. Carry case")}
            addLabel={t("Adaugă element", "Add item")}
            emptyHint={t(
              "Scrie câte un element sau lipește o listă întreagă — fiecare rând devine un element din listă.",
              "Type one item at a time or paste a whole list — each line becomes a list item.",
            )}
          />
        </div>

        {/* Usage rules */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("Regulile proprietarului", "Owner's rules")} <span className="font-normal text-muted-foreground">{t("(opțional)", "(optional)")}</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "Specifică cerințele tale pentru utilizarea bunului (interdicții, condiții de transport sau curățenie).",
              "Specify your requirements for using the item (restrictions, transport or cleaning conditions).",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { ro: "Doar în interior", en: "Indoor use only" },
              { ro: "Fără fumat", en: "No smoking" },
              { ro: "Curățat la returnare", en: "Cleaned on return" },
              { ro: "Baterie încărcată la retur", en: "Battery charged on return" },
            ].map((s) => {
              const label = t(s.ro, s.en);
              const already = data.usage_rules.includes(label);
              return (
                <button
                  key={s.ro}
                  type="button"
                  disabled={already}
                  onClick={() => update("usage_rules", [...data.usage_rules, label])}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
                >
                  + {label}
                </button>
              );
            })}
          </div>
          <ListItemsInput
            items={data.usage_rules}
            onChange={(rules) => update("usage_rules", rules)}
            placeholder={t("Ex: Doar în interior, Fără fumat, Curățat la returnare", "E.g. Indoor use only, No smoking, Cleaned on return")}
            addLabel={t("Adaugă regulă", "Add rule")}
            emptyHint={t(
              "Scrie câte o regulă sau lipește o listă întreagă — fiecare rând devine o regulă din listă.",
              "Type one rule at a time or paste a whole list — each line becomes a rule.",
            )}
          />
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------- STEP 3 ----------------------------------- */

const Step3Photos = ({
  data,
  update,
  userId,
  errors,
}: {
  data: PublishFormData;
  update: <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;
  userId: string;
  errors: Record<string, string>;
}) => {
  return (
    <div>
      <StepHeader
        eyebrow="Pasul 3 din 6"
        title="Adaugă fotografii"
        subtitle="Anunțurile cu 6+ poze de calitate au de 2x mai multe rezervări. Prima poză devine coperta."
      />

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <ImageUpload userId={userId} images={data.images} onChange={(imgs) => update("images", imgs)} maxImages={10} />
        </div>

        {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}

        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Sfaturi pentru poze bune:</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>Lumină naturală, fără bliț</li>
                <li>Fundal curat, neutru</li>
                <li>Arată produsul din 3-4 unghiuri + detalii</li>
                <li>Include accesoriile incluse</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------- STEP 4 ----------------------------------- */

const Step4Location = ({
  data,
  update,
  errors,
}: {
  data: PublishFormData;
  update: <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;
  errors: Record<string, string>;
}) => {
  const { t } = useLanguage();
  const cities = [...(judete.find((j) => j.name === data.location_county)?.localitati || [])].sort(
    (a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }),
  );

  return (
    <div>
      <StepHeader
        eyebrow={t("Pasul 3 din 4", "Step 3 of 4")}
        title={t("Unde se află produsul?", "Where is the product located?")}
        subtitle={t(
          "Adresa exactă este vizibilă doar după ce o rezervare e confirmată.",
          "The exact address is visible only after a booking is confirmed.",
        )}
      />

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("Județ", "County")}</Label>
            <select
              value={data.location_county}
              onChange={(e) => {
                update("location_county", e.target.value);
                update("location_city", "");
              }}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("Selectează județul", "Select county")}</option>
              {judete.map((j) => (
                <option key={j.name} value={j.name}>
                  {j.name}
                </option>
              ))}
            </select>
            {errors.location_county && <p className="text-sm text-destructive">{errors.location_county}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("Localitate", "City")}</Label>
            <select
              value={data.location_city}
              onChange={(e) => update("location_city", e.target.value)}
              disabled={!data.location_county}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">{data.location_county ? t("Selectează localitatea", "Select city") : t("Alege întâi județul", "Pick a county first")}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.location_city && <p className="text-sm text-destructive">{errors.location_city}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {t("Adresă ridicare", "Pickup address")}
          </Label>
          <Input
            placeholder={t("Ex: Strada Exemplu nr. 10, Sector 1", "E.g. 10 Example Street, District 1")}
            value={data.pickup_address}
            onChange={(e) => update("pickup_address", e.target.value)}
            maxLength={200}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            {t("Apare pe pagina anunțului și ajută chiriașii să vadă unde se află produsul.", "Shown on the listing page and helps renters see where the product is located.")}
          </p>
        </div>

      </div>
    </div>
  );
};

/* ----------------------------------- STEP 5 ----------------------------------- */

const PRESET_DAYS: Record<MinRentalPreset, number> = {
  "1_day": 1,
  weekend: 2,
  "3_days": 3,
  "7_days": 7,
  custom: 1,
};
const PRESET_LABELS: Record<MinRentalPreset, string> = {
  "1_day": "1 zi",
  weekend: "Weekend",
  "3_days": "3 zile",
  "7_days": "1 săptămână",
  custom: "Custom",
};

const Step5Pricing = ({
  data,
  update,
  feePercent,
  freeListingsLeft,
  errors,
}: {
  data: PublishFormData;
  update: <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;
  feePercent: number;
  freeListingsLeft: number;
  errors: Record<string, string>;
}) => {
  const { t } = useLanguage();
  const [pricing, setPricing] = useState<SimilarPricing | null>(null);

  useEffect(() => {
    if (data.category) {
      getSimilarPricing(data.category, data.subcategory).then(setPricing);
    }
  }, [data.category, data.subcategory]);

  const owner = data.daily_price_owner ?? 0;
  // NEW MODEL: client pays owner price + commission (min 1 RON when fee > 0).
  // Preview at the per-day level uses a 1-day rental.
  const commission = owner > 0 ? calcPlatformFee(owner, feePercent) : 0;
  const client = owner > 0 ? Math.round((owner + commission) * 100) / 100 : 0;

  return (
    <div>
      <StepHeader
        eyebrow={t("Pasul 3 din 4", "Step 3 of 4")}
        title={t("Preț chirie", "Rental price")}
        subtitle={t(
          "Setează cât vrei să primești pe zi. Comisionul platformei se adaugă automat clientului.",
          "Set how much you want to receive per day. The platform fee is added automatically for the client.",
        )}
      />

      <div className="mt-6 space-y-6">
        {/* Price */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <Label className="text-sm font-semibold">{t("Preț pe zi (vrei să primești)", "Price per day (what you receive)")}</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="number"
              min={2}
              step={1}
              inputMode="numeric"
              pattern="[0-9]*"
              value={data.daily_price_owner ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") { update("daily_price_owner", null); return; }
                const n = Math.max(0, Math.floor(Number(raw)));
                update("daily_price_owner", Number.isFinite(n) ? n : null);
              }}
              placeholder="50"
              className="h-14 text-2xl font-semibold"
            />
            <span className="text-lg font-medium text-muted-foreground">{t("RON / zi", "RON / day")}</span>
          </div>
          {errors.daily_price_owner && (
            <p className="mt-1 text-sm text-destructive">{errors.daily_price_owner}</p>
          )}

          {/* Pricing benchmark */}
          {pricing && pricing.sample_size >= 3 && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4 text-xs">
              <p className="font-medium text-foreground">
                {t("Prețuri similare în", "Similar prices in")} {data.subcategory || data.category}{" "}
                <span className="text-muted-foreground">({pricing.sample_size} {t("anunțuri", "listings")})</span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Bench label={t("Ieftin", "Cheap")} value={pricing.p25} />
                <Bench label={t("Mediu", "Average")} value={pricing.p50} highlight />
                <Bench label={t("Premium", "Premium")} value={pricing.p75} />
              </div>
            </div>
          )}

          {owner > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-primary/5 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t("Tu primești", "You receive")}</p>
                <p className="text-lg font-bold text-foreground">{owner} RON</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("Clientul plătește", "Client pays")}</p>
                <p className="text-lg font-bold text-primary">{client} RON</p>
                <p className="text-[11px] text-muted-foreground">
                  {feePercent === 0
                    ? t("Comision Rentli 0% — gratuit 🎉", "0% Rentli fee — free 🎉")
                    : `+ ${commission} RON ${t("comision Rentli", "Rentli fee")} (${feePercent}%)`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("+ procesare card Stripe (1,4% + 1 RON / plată)", "+ Stripe card processing (1.4% + 1 RON / payment)")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("+ asigurare (în curând)", "+ insurance (coming soon)")}
                </p>
              </div>
              {freeListingsLeft > 0 && feePercent === 0 && (
                <div className="col-span-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700">
                  🎉 {t(
                    `Mai ai ${freeListingsLeft} ${freeListingsLeft === 1 ? "anunț" : "anunțuri"} cu 0% comision`,
                    `You have ${freeListingsLeft} more ${freeListingsLeft === 1 ? "listing" : "listings"} with 0% fee`,
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const Bench = ({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) => (
  <div
    className={cn(
      "rounded-lg border px-2 py-2",
      highlight ? "border-primary bg-primary/10" : "border-border bg-background",
    )}
  >
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn("text-sm font-bold", highlight ? "text-primary" : "text-foreground")}>
      {value != null ? `${Math.round(value)} RON` : "—"}
    </p>
  </div>
);

/* ----------------------------------- STEP 6 ----------------------------------- */

const Step6Review = ({
  data,
  feePercent,
  onJump,
  mode,
}: {
  data: PublishFormData;
  feePercent: number;
  onJump: (s: number) => void;
  mode: "create" | "edit";
}) => {
  const { t, language } = useLanguage();
  const score = computeQualityScore(data, language);
  const owner = data.daily_price_owner ?? 0;

  return (
    <div>
      <StepHeader
        eyebrow={t("Pasul 4 din 4", "Step 4 of 4")}
        title={mode === "edit" ? t("Verifică modificările", "Review changes") : t("Aproape gata!", "Almost done!")}
        subtitle={
          mode === "edit"
            ? t(
                "Verifică schimbările înainte de a salva. Anunțul va rămâne activ după update.",
                "Review the changes before saving. The listing will remain active after the update.",
              )
            : t(
                "Verifică detaliile. După publicare, anunțul intră în aprobare (uzual sub 2 ore).",
                "Review the details. After publishing, the listing goes into review (usually under 2 hours).",
              )
        }
      />

      <div className="mt-6 space-y-4">
        <QualityScoreCard data={data} />

        <ReviewRow label={t("Categorie", "Category")} value={data.category + (data.subcategory ? ` · ${data.subcategory}` : "")} onEdit={() => onJump(1)} />
        <ReviewRow label={t("Titlu", "Title")} value={data.title} onEdit={() => onJump(2)} />
        <ReviewRow
          label={t("Descriere", "Description")}
          value={data.description ? `${data.description.slice(0, 120)}${data.description.length > 120 ? "…" : ""}` : "—"}
          onEdit={() => onJump(2)}
        />
        <ReviewRow
          label={t("Stare", "Condition")}
          value={data.condition ? CONDITION_LABELS[data.condition][language] : "—"}
          onEdit={() => onJump(2)}
        />
        <ReviewRow label={t("Fotografii", "Photos")} value={`${data.images.length} ${t("imagini", "images")}`} onEdit={() => onJump(2)} />
        <ReviewRow
          label={t("Locație", "Location")}
          value={`${data.location_city}${data.location_county ? `, ${data.location_county}` : ""}`}
          onEdit={() => onJump(3)}
        />
        <ReviewRow
          label={t("Preț", "Price")}
          value={`${owner} ${t("RON/zi", "RON/day")} · ${t("client plătește/zi", "client pays/day")} ${Math.round((owner + calcPlatformFee(owner, feePercent)) * 100) / 100} RON`}
          onEdit={() => onJump(3)}
        />

        {score.total < 60 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">{t("Anunțul tău încă poate fi îmbunătățit", "Your listing can still be improved")}</p>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                  {t(
                    "Poți publica acum, dar un scor mai mare aduce mai multe rezervări. Vezi sugestiile din scorul de calitate.",
                    "You can publish now, but a higher score brings more bookings. See the suggestions in the quality score.",
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewRow = ({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
    <EditButton onEdit={onEdit} />
  </div>
);

const EditButton = ({ onEdit }: { onEdit: () => void }) => {
  const { t } = useLanguage();
  return (
    <Button variant="ghost" size="sm" onClick={onEdit} className="text-primary hover:text-primary">
      {t("Editează", "Edit")}
    </Button>
  );
};

/* ---------------------------- shared header ---------------------------- */

const StepHeader = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
    <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>
  </div>
);

// ---------- Blocked dates picker ----------
const fmtLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseLocal = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const expandRange = (start: Date, end: Date): string[] => {
  const out: string[] = [];
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const cur = a <= b ? a : b;
  const stop = a <= b ? b : a;
  while (cur <= stop) {
    out.push(fmtLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

const BlockedDatesPicker = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) => {
  const [mode, setMode] = useState<"single" | "range">("single");
  const [range, setRange] = useState<DateRange | undefined>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = [...value].sort();
  const selectedDates = sorted.map(parseLocal);

  const addRange = () => {
    if (!range?.from || !range?.to) return;
    const merged = Array.from(new Set([...value, ...expandRange(range.from, range.to)]));
    onChange(merged.sort());
    setRange(undefined);
  };

  const removeOne = (s: string) => onChange(value.filter((d) => d !== s));
  const clearAll = () => onChange([]);

  return (
    <div className="mt-3 space-y-3">
      <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("single");
            setRange(undefined);
          }}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            mode === "single" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Zile individuale
        </button>
        <button
          type="button"
          onClick={() => setMode("range")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            mode === "range" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Interval
        </button>
      </div>

      {mode === "single" ? (
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => onChange((dates || []).map(fmtLocal).sort())}
          className="p-3 pointer-events-auto"
          disabled={(d) => d < today}
        />
      ) : (
        <div className="space-y-3">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            className="p-3 pointer-events-auto"
            disabled={(d) => d < today}
          />
          {range?.from && range?.to && (
            <Button type="button" onClick={addRange} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă {expandRange(range.from, range.to).length} zile blocate
            </Button>
          )}
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">
              {value.length} {value.length === 1 ? "zi blocată" : "zile blocate"}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-muted-foreground hover:text-destructive"
            >
              Șterge tot
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((s) => {
              const d = parseLocal(s);
              const label = `${d.getDate()} ${d.toLocaleDateString("ro-RO", { month: "short" })}`;
              return (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeOne(s)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    aria-label={`Elimină ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
