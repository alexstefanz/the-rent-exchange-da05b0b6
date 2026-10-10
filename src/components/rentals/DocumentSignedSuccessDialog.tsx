import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type DocumentSignedDetail = {
  document: string;
  publicId?: string | null;
  bothSigned?: boolean;
};

export function notifyDocumentSigned(detail: DocumentSignedDetail) {
  window.dispatchEvent(new CustomEvent<DocumentSignedDetail>("rentli:document-signed", { detail }));
}

export default function DocumentSignedSuccessHost() {
  const [detail, setDetail] = useState<DocumentSignedDetail | null>(null);
  useEffect(() => {
    const h = (e: Event) => setDetail((e as CustomEvent<DocumentSignedDetail>).detail);
    window.addEventListener("rentli:document-signed", h);
    return () => window.removeEventListener("rentli:document-signed", h);
  }, []);

  return (
    <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
      <DialogContent className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-9 w-9 text-primary" />
        </div>
        <DialogTitle className="text-xl">Semnătură înregistrată cu succes!</DialogTitle>
        <p className="font-medium text-foreground">
          {detail?.document}{detail?.publicId ? ` · ${detail.publicId}` : ""}
        </p>
        <DialogDescription>
          {detail?.bothSigned
            ? "Ambele părți au semnat! Documentul este acum validat și arhivat în secțiunea Documente a închirierii."
            : detail?.bothSigned === false
              ? "Semnătura ta a fost salvată pe document. Se așteaptă semnătura celuilalt participant."
              : "Semnătura ta a fost salvată pe document. Îl găsești oricând în secțiunea Documente a închirierii."}
        </DialogDescription>
        <Button className="mt-2 w-full" onClick={() => setDetail(null)}>Am înțeles / Continuă</Button>
      </DialogContent>
    </Dialog>
  );
}
