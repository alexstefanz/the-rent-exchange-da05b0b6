import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { uxCopyBilingual, resolveLanguage, type UxCopyResolved } from "@/data/uxCopy";

export const useUxCopy = (): UxCopyResolved => {
  const { language } = useLanguage();
  return useMemo(() => resolveLanguage(uxCopyBilingual, language), [language]);
};
