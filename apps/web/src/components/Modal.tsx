import { useCallback, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key.toLowerCase() === "x") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 cursor-pointer"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        role="button"
        tabIndex={0}
      />

      <div className="relative bg-bg border-4 border-text z-10 w-full max-w-md mx-4 shadow-xl">
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border bg-bg-light">
            <h2 className="text-xl font-mono font-bold text-text">
              {title.toUpperCase()}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-error transition-colors px-2 font-mono text-lg"
              title="Press X or ESC to close"
            >
              [X]
            </button>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
