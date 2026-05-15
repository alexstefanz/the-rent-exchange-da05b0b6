import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  X,
  Plus,
  Truck,
  MapPin,
  Shield,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  Image as ImageIcon,
  Tag,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  createProduct,
  updateProduct,
  getOwnerProductCount,
  calculateClientPrice,
  type Product,
} from "@/features/products/productsApi";
import { categories } from "@/data/categories";
import { judete } from "@/data/romaniaLocations";
import {
  emptyPublishForm,
  CONDITION_LABELS,
  DEFAULT_USAGE_RULES,
  stepValidators,
  type PublishFormData,
  type ProductCondition,
  type DepositType,
  type MinRentalPreset,
} from "@/lib/publishTypes";
import { computeQualityScore } from "@/lib/qualityScore";
import { upsertDraft, deleteDraft, getActiveDraft } from "@/features/publish/draftsApi";
import { generateProductDescription } from "@/features/publish/aiDescriptionApi";
import { getSimilarPricing, type SimilarPricing } from "@/features/publish/pricingBenchmarkApi";
import ImageUpload from "@/components/products/ImageUpload";
import LivePreviewCard from "./LivePreviewCard";
import QualityScoreCard from "./QualityScoreCard";
import PublishStepper, { type StepDef } from "./PublishStepper";
import PublishTopBar from "./PublishTopBar";
import PublishFooter from "./PublishFooter";
import { cn } from "@/lib/utils";
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

const STEPS: StepDef[] = [
  { id: 1, label: "Categorie", shortLabel: "Categorie" },
  { id: 2, label: "Fotografii & detalii", shortLabel: "Detalii" },
  { id: 3, label: "Locație", shortLabel: "Locație" },
  { id: 4, label: "Preț & disponibilitate", shortLabel: "Preț" },
  { id: 5, label: "Verificare & publicare", shortLabel: "Publică" },
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
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
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

  const [feePercent, setFeePercent] = useState(5);
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

  // load fee
  useEffect(() => {
    if (!user) return;
    if (mode === "edit") return;
    getOwnerProductCount(user.id).then((count) => {
      const free = Math.max(0, 3 - count);
      setFreeListingsLeft(free);
      setFeePercent(count < 3 ? 0 : 5);
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
    setDraftId(pendingDraft.id);
    setData({ ...emptyPublishForm(), ...pendingDraft.payload });
    // Remap legacy draft step (6-step wizard) to new 5-step wizard
    const legacyMap: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5 };
    const remapped = legacyMap[pendingDraft.step] ?? Math.min(pendingDraft.step || 1, 5);
    setStep(remapped);
    setMaxReached(remapped);
    setPendingDraft(null);
  };

  const handleStartFresh = async () => {
    if (!pendingDraft) return;
    try {
      await deleteDraft(pendingDraft.id);
    } catch {
      // non-blocking
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
            error: { errors: [{ path: ["subcategory"], message: "Selectează o subcategorie" }] },
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
      3: () =>
        stepValidators.step4.safeParse({
          location_county: data.location_county,
          location_city: data.location_city,
        }),
      4: () => stepValidators.step5.safeParse({ daily_price_owner: data.daily_price_owner }),
      5: () => ({ success: true }),
    };
    const result = validators[s]();
    if (!result.success) {
      const flat: Record<string, string> = {};
      result.error?.errors?.forEach((e: any) => {
        flat[e.path[0]] = e.message;
      });
      setErrors(flat);
      const firstMsg = Object.values(flat)[0];
      if (firstMsg) toast({ title: "Verifică datele", description: firstMsg, variant: "destructive" });
      return false;
    }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (step === 5) {
      handlePublish();
      return;
    }
    if (!validateStep(step)) return;
    const next = step + 1;
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const goBack = () => {
    if (step === 1) return;
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const jump = (s: number) => {
    if (s <= maxReached) {
      setStep(s);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  };

  const handleExit = () => {
    toast({ title: mode === "create" ? "Draftul tău este salvat" : "Modificările nesalvate au fost păstrate local" });
    navigate("/owner");
  };

  const handlePublish = async () => {
    if (!user) return;
    // Validate critical steps
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
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
        await updateProduct(productId, { ...payload, is_active: data.is_active }, user.id);
        await queryClient.invalidateQueries({ queryKey: ["my-products", user.id] });
        await queryClient.invalidateQueries({ queryKey: ["product", productId] });
        toast({ title: "Anunț actualizat", description: "Modificările au fost salvate." });
        navigate("/owner");
      } else {
        await createProduct(payload, user.id);
        if (draftId) await deleteDraft(draftId);
        toast({
          title: "Anunț trimis spre aprobare",
          description: "Vei primi o notificare când e aprobat (uzual sub 2 ore).",
        });
        navigate("/owner");
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === "KYC_REQUIRED" || err?.message?.includes("KYC_REQUIRED")) {
        toast({ title: "Verificare necesară", description: "Te redirecționăm la KYC.", variant: "destructive" });
        setTimeout(() => navigate("/verificare"), 600);
        return;
      }
      toast({ title: "Eroare la publicare", description: err?.message || "Încearcă din nou.", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedCat = categories.find((c) => c.name === data.category);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublishTopBar saveStatus={saveStatus} lastSavedAt={lastSavedAt} onExit={handleExit} mode={mode} />
      <PublishStepper steps={STEPS} current={step} maxReached={maxReached} onJump={jump} />

      <main className="flex-1">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            {step === 1 && <Step1Category data={data} update={update} />}
            {step === 2 && user && (
              <Step2Details data={data} update={update} errors={errors} feePercent={feePercent} userId={user.id} />
            )}
            {step === 3 && <Step4Location data={data} update={update} errors={errors} />}
            {step === 4 && <Step5Pricing data={data} update={update} feePercent={feePercent} freeListingsLeft={freeListingsLeft} errors={errors} />}
            {step === 5 && <Step6Review data={data} feePercent={feePercent} onJump={jump} mode={mode} />}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Previzualizare live
              </p>
              <LivePreviewCard data={data} feePercent={feePercent} />
              {step >= 2 && <QualityScoreCard data={data} />}
            </div>
          </aside>
        </div>
      </main>

      <PublishFooter
        current={step}
        total={STEPS.length}
        onBack={goBack}
        onNext={goNext}
        isLoading={isPublishing}
        isFinal={step === STEPS.length}
      />

      <AlertDialog open={!!pendingDraft}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ai un anunț nesalvat</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Am găsit un draft început anterior. Vrei să continui de unde ai rămas sau să începi un anunț nou?</p>
                {pendingDraft && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-foreground">
                    <p className="font-semibold">
                      {pendingDraft.payload.title?.trim() || "Anunț fără titlu"}
                    </p>
                    {pendingDraft.payload.category && (
                      <p className="text-xs text-muted-foreground">{pendingDraft.payload.category}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ultima modificare:{" "}
                      {new Date(pendingDraft.updated_at).toLocaleString("ro-RO", {
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
            <AlertDialogCancel onClick={handleStartFresh}>Începe anunț nou</AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueDraft}>Continuă draftul</AlertDialogAction>
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
}: {
  data: PublishFormData;
  update: <K extends keyof PublishFormData>(k: K, v: PublishFormData[K]) => void;
}) => {
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
        eyebrow="Pasul 1 din 6"
        title="Ce vrei să închiriezi?"
        subtitle="Alege o categorie ca să-ți arătăm câmpurile potrivite și prețul mediu din piață."
      />

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Caută categorie (ex: bicicletă, cameră foto, drujbă...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((cat) => {
          const active = data.category === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                update("category", cat.name);
                update("subcategory", "");
              }}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
              )}
            >
              <span className="text-3xl">{cat.icon}</span>
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
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <Label className="text-sm font-semibold text-foreground">
            Subcategorie <span className="text-destructive">*</span>
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
        </div>
      )}
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
  const [genLoading, setGenLoading] = useState(false);
  const { toast } = useToast();
  const [newItem, setNewItem] = useState("");
  const [newRule, setNewRule] = useState("");

  const handleGenerate = async () => {
    if (!data.title || data.title.length < 5) {
      toast({ title: "Adaugă mai întâi titlul", variant: "destructive" });
      return;
    }
    setGenLoading(true);
    try {
      const desc = await generateProductDescription({
        title: data.title,
        category: data.category,
        subcategory: data.subcategory,
        condition: data.condition || undefined,
        included_items: data.included_items,
        usage_rules: data.usage_rules,
      });
      update("description", desc);
      toast({ title: "Descriere generată", description: "Ajusteaz-o cum vrei." });
    } catch (e: any) {
      toast({ title: "Eroare AI", description: e?.message || "Încearcă din nou.", variant: "destructive" });
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div>
      <StepHeader
        eyebrow="Pasul 2 din 5"
        title="Fotografii & detalii"
        subtitle="Adaugă întâi pozele (6+ recomandat) — apoi completează titlul și descrierea."
      />

      <div className="mt-6 space-y-6">
        {/* Photos */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Fotografii <span className="font-normal text-muted-foreground">(prima poză devine coperta)</span>
          </Label>
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

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-semibold">
            Titlu anunț
          </Label>
          <Input
            id="title"
            placeholder="Ex: Bicicletă MTB Trek Marlin 7, mărime L"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-12 text-base"
            maxLength={100}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Folosește brand, model și particularități. Fără date de contact.</span>
            <span className={cn(data.title.length > 90 ? "text-amber-600" : "text-muted-foreground")}>{data.title.length}/100</span>
          </div>
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Starea produsului</Label>
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
                  {CONDITION_LABELS[c].ro}
                </button>
              );
            })}
          </div>
          {errors.condition && <p className="text-sm text-destructive">{errors.condition}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-semibold">
              Descriere
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={genLoading}
              className="gap-1.5"
            >
              {genLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
              Generează cu AI
            </Button>
          </div>
          <Textarea
            id="description"
            placeholder="Descrie pentru ce e potrivit, ce e inclus, particularități sau atenționări..."
            rows={6}
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={2000}
            className="resize-none text-base"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Min. 60 caractere recomandate. Fără email/telefon/link-uri.</span>
            <span className="text-muted-foreground">{data.description.length}/2000</span>
          </div>
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* Included items */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Ce este inclus <span className="font-normal text-muted-foreground">(accesorii)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Husă transport, încărcător, manual"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = newItem.trim();
                  if (t && !data.included_items.includes(t)) {
                    update("included_items", [...data.included_items, t]);
                    setNewItem("");
                  }
                }
              }}
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const t = newItem.trim();
                if (t && !data.included_items.includes(t)) {
                  update("included_items", [...data.included_items, t]);
                  setNewItem("");
                }
              }}
              className="h-11"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {data.included_items.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {data.included_items.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => update("included_items", data.included_items.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Usage rules */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Reguli de utilizare <span className="font-normal text-muted-foreground">(opțional)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Doar în interior, fără copii sub 12 ani"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = newRule.trim();
                  if (t && !data.usage_rules.includes(t)) {
                    update("usage_rules", [...data.usage_rules, t]);
                    setNewRule("");
                  }
                }
              }}
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const t = newRule.trim();
                if (t && !data.usage_rules.includes(t)) {
                  update("usage_rules", [...data.usage_rules, t]);
                  setNewRule("");
                }
              }}
              className="h-11"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_USAGE_RULES.map((r) => {
              const active = data.usage_rules.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    update(
                      "usage_rules",
                      active ? data.usage_rules.filter((x) => x !== r) : [...data.usage_rules, r],
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40",
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {data.usage_rules.filter((r) => !(DEFAULT_USAGE_RULES as readonly string[]).includes(r)).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {data.usage_rules
                .filter((r) => !(DEFAULT_USAGE_RULES as readonly string[]).includes(r))
                .map((rule, i) => (
                  <span
                    key={`${rule}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                  >
                    {rule}
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "usage_rules",
                          data.usage_rules.filter((x) => x !== rule),
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
            </div>
          )}
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
  const cities = judete.find((j) => j.name === data.location_county)?.localitati || [];

  return (
    <div>
      <StepHeader
        eyebrow="Pasul 3 din 5"
        title="Unde se află produsul?"
        subtitle="Adresa exactă este vizibilă doar după ce o rezervare e confirmată."
      />

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Județ</Label>
            <select
              value={data.location_county}
              onChange={(e) => {
                update("location_county", e.target.value);
                update("location_city", "");
              }}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selectează județul</option>
              {judete.map((j) => (
                <option key={j.name} value={j.name}>
                  {j.name}
                </option>
              ))}
            </select>
            {errors.location_county && <p className="text-sm text-destructive">{errors.location_county}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Localitate</Label>
            <select
              value={data.location_city}
              onChange={(e) => update("location_city", e.target.value)}
              disabled={!data.location_county}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">{data.location_county ? "Selectează localitatea" : "Alege întâi județul"}</option>
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
            Adresă ridicare <span className="font-normal text-muted-foreground">(privată)</span>
          </Label>
          <Input
            placeholder="Ex: Strada Exemplu nr. 10, Sector 1"
            value={data.pickup_address}
            onChange={(e) => update("pickup_address", e.target.value)}
            maxLength={200}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            <Shield className="mr-1 inline h-3 w-3" />
            Adresa apare doar pentru clienții cu rezervare confirmată. În anunț vizibil e doar orașul.
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
  const [pricing, setPricing] = useState<SimilarPricing | null>(null);

  useEffect(() => {
    if (data.category) {
      getSimilarPricing(data.category, data.subcategory).then(setPricing);
    }
  }, [data.category, data.subcategory]);

  const owner = data.daily_price_owner ?? 0;
  const client = owner > 0 ? calculateClientPrice(owner, feePercent) : 0;
  const commission = Math.round((client - owner) * 100) / 100;

  return (
    <div>
      <StepHeader
        eyebrow="Pasul 4 din 5"
        title="Preț chirie"
        subtitle="Setează cât vrei să primești pe zi. Comisionul platformei se adaugă automat clientului."
      />

      <div className="mt-6 space-y-6">
        {/* Price */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <Label className="text-sm font-semibold">Preț pe zi (vrei să primești)</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="number"
              min={2}
              value={data.daily_price_owner ?? ""}
              onChange={(e) =>
                update("daily_price_owner", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="50"
              className="h-14 text-2xl font-semibold"
            />
            <span className="text-lg font-medium text-muted-foreground">RON / zi</span>
          </div>
          {errors.daily_price_owner && (
            <p className="mt-1 text-sm text-destructive">{errors.daily_price_owner}</p>
          )}

          {/* Pricing benchmark */}
          {pricing && pricing.sample_size >= 3 && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4 text-xs">
              <p className="font-medium text-foreground">
                Prețuri similare în {data.subcategory || data.category}{" "}
                <span className="text-muted-foreground">({pricing.sample_size} anunțuri)</span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Bench label="Ieftin" value={pricing.p25} />
                <Bench label="Mediu" value={pricing.p50} highlight />
                <Bench label="Premium" value={pricing.p75} />
              </div>
            </div>
          )}

          {owner > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-primary/5 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tu primești</p>
                <p className="text-lg font-bold text-foreground">{owner} RON</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientul plătește</p>
                <p className="text-lg font-bold text-primary">{client} RON</p>
                <p className="text-[11px] text-muted-foreground">
                  {feePercent === 0 ? "Comision 0% — gratuit 🎉" : `+ ${commission} RON comision (${feePercent}%)`}
                </p>
              </div>
              {freeListingsLeft > 0 && feePercent === 0 && (
                <div className="col-span-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700">
                  🎉 Mai ai {freeListingsLeft} anunț{freeListingsLeft > 1 ? "uri" : ""} cu 0% comision
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
  const score = computeQualityScore(data);
  const owner = data.daily_price_owner ?? 0;
  const monthlyEstimate = Math.round(owner * 8); // ~8 zile/lună la productivitate medie

  return (
    <div>
      <StepHeader
        eyebrow="Pasul 5 din 5"
        title={mode === "edit" ? "Verifică modificările" : "Aproape gata!"}
        subtitle={
          mode === "edit"
            ? "Verifică schimbările înainte de a salva. Anunțul va rămâne activ după update."
            : "Verifică detaliile. După publicare, anunțul intră în aprobare (uzual sub 2 ore)."
        }
      />

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Câștig estimat</p>
          <p className="mt-1 text-3xl font-bold text-foreground">~{monthlyEstimate} RON / lună</p>
          <p className="mt-1 text-xs text-muted-foreground">
            La 8 zile închiriate, fără comisioane suplimentare. Plata e săptămânală în contul tău.
          </p>
        </div>

        <QualityScoreCard data={data} />

        <ReviewRow label="Categorie" value={data.category + (data.subcategory ? ` · ${data.subcategory}` : "")} onEdit={() => onJump(1)} />
        <ReviewRow label="Titlu" value={data.title} onEdit={() => onJump(2)} />
        <ReviewRow
          label="Descriere"
          value={data.description ? `${data.description.slice(0, 120)}${data.description.length > 120 ? "…" : ""}` : "—"}
          onEdit={() => onJump(2)}
        />
        <ReviewRow
          label="Stare"
          value={data.condition ? CONDITION_LABELS[data.condition].ro : "—"}
          onEdit={() => onJump(2)}
        />
        <ReviewRow label="Fotografii" value={`${data.images.length} imagini`} onEdit={() => onJump(2)} />
        <ReviewRow
          label="Locație"
          value={`${data.location_city}${data.location_county ? `, ${data.location_county}` : ""}`}
          onEdit={() => onJump(3)}
        />
        <ReviewRow
          label="Preț"
          value={`${owner} RON/zi · client ${calculateClientPrice(owner, feePercent)} RON`}
          onEdit={() => onJump(4)}
        />

        {score.total < 60 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">Anunțul tău încă poate fi îmbunătățit</p>
                <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                  Poți publica acum, dar un scor mai mare aduce mai multe rezervări. Vezi sugestiile din scorul de calitate.
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
    <Button variant="ghost" size="sm" onClick={onEdit} className="text-primary hover:text-primary">
      Editează
    </Button>
  </div>
);

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