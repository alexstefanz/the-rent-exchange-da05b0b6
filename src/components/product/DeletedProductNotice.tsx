import { Link } from "react-router-dom";
import { PackageX } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useUxCopy } from "@/hooks/useUxCopy";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";

const DeletedProductNotice = () => {
  const copy = useUxCopy();
  const { t } = useLanguage();

  useSEO({
    title: `${copy.product.deletedTitle} | Rentli`,
    description: copy.product.deletedSubtitle,
    noindex: true,
    canonical: typeof window !== "undefined" ? window.location.href : undefined,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-20 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PackageX className="h-10 w-10" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {copy.product.deletedTitle}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {copy.product.deletedSubtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/categorii">{copy.product.deletedBrowseCta}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">{copy.product.deletedHomeCta}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeletedProductNotice;