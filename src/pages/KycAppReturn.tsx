import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ALLOWED = /^(rentli|exp|exps):\/\//i;

const KycAppReturn = () => {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("redirect") || "";
  const redirect = ALLOWED.test(raw) ? raw : null;

  useEffect(() => {
    if (redirect) window.location.href = redirect;
  }, [redirect]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-heading text-xl font-semibold">
        Verificare finalizată ✓ — revino în aplicația Rentli
      </h1>
      {redirect ? (
        <Button onClick={() => { window.location.href = redirect; }}>Deschide aplicația</Button>
      ) : (
        <Link to="/" className="text-primary underline underline-offset-4">
          Mergi la pagina principală
        </Link>
      )}
    </div>
  );
};

export default KycAppReturn;
