import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ListItemsInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  emptyHint?: string;
}

const clean = (raw: string) =>
  raw.replace(/^\s*(?:[-–—*•]|\d+[.)])\s*/, "").trim();

/** Adds the parsed parts of `value` to `items`, deduped. */
const mergeParts = (items: string[], value: string) => {
  const parts = value
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);
  const next = [...items];
  for (const p of parts) if (!next.includes(p)) next.push(p);
  return next;
};

/**
 * List-builder input: every item is its own row (add row by row, remove with X).
 * Pasting a multi-line block is split automatically into separate items.
 */
const ListItemsInput = ({ items, onChange, placeholder, addLabel, emptyHint }: ListItemsInputProps) => {
  const { t } = useLanguage();
  const [value, setValue] = useState("");

  const commit = () => {
    if (!value.trim()) return;
    onChange(mergeParts(items, value));
    setValue("");
  };

  const handleChange = (v: string) => {
    if (v.includes("\n")) {
      onChange(mergeParts(items, v));
      setValue("");
    } else {
      setValue(v);
    }
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className="flex-1 text-sm break-words text-foreground">{item}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={t("Șterge element", "Remove item")}
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="h-11 text-base"
        />
        <Button
          type="button"
          variant="outline"
          onClick={commit}
          disabled={!value.trim()}
          className="h-11 shrink-0 gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      {emptyHint && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
    </div>
  );
};

export { ListItemsInput };
export default ListItemsInput;
