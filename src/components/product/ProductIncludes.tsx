import { Check, Package } from "lucide-react";
import { uxCopy } from "@/data/uxCopy";

interface ProductIncludesProps {
  items?: string[];
}

const defaultItems = [
  "Produs în stare perfectă de funcționare",
  "Încărcător / accesorii standard",
  "Husă de transport (dacă este cazul)",
  "Manual de utilizare",
];

const ProductIncludes = ({ items = defaultItems }: ProductIncludesProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        {uxCopy.product.includes}
      </h2>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-3 w-3 text-emerald-600" />
            </div>
            <span className="text-sm text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductIncludes;
