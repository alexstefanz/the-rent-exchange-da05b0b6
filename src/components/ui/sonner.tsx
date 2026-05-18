import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <>
      {/* Default top-center toaster for any legacy toast.* calls. */}
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        position="top-center"
        duration={3000}
        closeButton
        visibleToasts={1}
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:rounded-2xl group-[.toaster]:shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.18)] group-[.toaster]:px-4 group-[.toaster]:py-3.5",
            description: "group-[.toast]:text-muted-foreground",
            actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            closeButton:
              "!left-auto !right-2 !top-2 !bg-transparent !border-0 !text-muted-foreground hover:!text-foreground hover:!bg-muted/60 !rounded-full !h-6 !w-6 transition-colors",
          },
        }}
        {...props}
      />
      {/* Dedicated bottom-center viewport for our custom notification cards. */}
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster-bottom group"
        position="bottom-center"
        duration={6000}
        visibleToasts={1}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: "!bg-transparent !border-0 !shadow-none !p-0",
          },
        }}
      />
    </>
  );
};

export { Toaster, toast };
