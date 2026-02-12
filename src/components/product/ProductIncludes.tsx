import { Check, Package } from "lucide-react";
import { useUxCopy } from "@/hooks/useUxCopy";

interface ProductIncludesProps {
  items?: string[];
}

const ProductIncludes = ({ items }: ProductIncludesProps) => {
  const copy = useUxCopy();
  
  const defaultItems = [
    copy.productIncludes.item1,
    copy.productIncludes.item2,
    copy.productIncludes.item3,
    copy.productIncludes.item4,
  ];

  const displayItems = items || defaultItems;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        {copy.product.includes}
      </h2>
      <ul className="space-y-3">
        {displayItems.map((item, index) => (
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
