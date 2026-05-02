import { Button, Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@mandys/ui";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLink, FileText, X } from "lucide-react";

interface CatalogModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CatalogModal = ({ isOpen, onOpenChange }: CatalogModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 flex h-[78vh] w-[86vw] max-w-[980px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#111] shadow-[0_40px_120px_rgba(0,0,0,0.62)] focus:outline-none md:h-[80vh]">
          <DialogTitle className="sr-only">Catalogo de Productos</DialogTitle>
          <DialogDescription className="sr-only">
            Visualizador centrado del catalogo Mandy&apos;s Bar 2026 en formato PDF.
          </DialogDescription>

          <div className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-[#111] px-4 py-3 md:px-6 md:py-4">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white md:text-base">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                Catalogo Mandy&apos;s Bar 2026
              </h3>
              <p className="mt-1 text-xs text-zinc-400 md:text-sm">Vista directa del catalogo en PDF.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
                <a href="/catalogo_2026.pdf" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir aparte
                </a>
              </Button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Cerrar catalogo"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-zinc-100 p-3 md:p-4">
            <div className="h-full overflow-hidden rounded-[22px] bg-white shadow-inner">
              <iframe
                src="/catalogo_2026.pdf#view=FitH&pagemode=none"
                className="h-full w-full border-none"
                title="Catalogo Mandy's Bar"
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
