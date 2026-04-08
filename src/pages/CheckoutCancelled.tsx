import { Link } from "react-router-dom";
import { ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutCancelled = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Plata a fost anulată</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Plata nu a fost procesată. Poți reveni la checkout pentru a încerca din nou.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Acasă
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CheckoutCancelled;
