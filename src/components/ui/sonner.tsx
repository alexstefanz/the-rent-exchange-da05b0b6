import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  // Responsive offset so toasts always sit above the chat FAB
  // (mobile: FAB at bottom-20 ≈ 80px + 56px height; desktop: bottom-6 ≈ 24px + 56px).
  const [offset, setOffset] = useState<{ bottom: number; right: number }>({ bottom: 152, right: 16 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setOffset({ bottom: mq.matches ? 96 : 152, right: 16 });
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      offset={offset as any}
      duration={6000}
      visibleToasts={1}
      expand={false}
      gap={0}
      closeButton={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-transparent group-[.toaster]:!border-0 group-[.toaster]:!shadow-none group-[.toaster]:!p-0 group-[.toaster]:!opacity-100",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-2 !top-2 !bg-transparent !border-0 !text-muted-foreground hover:!text-foreground hover:!bg-muted/60 !rounded-full !h-6 !w-6 transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
