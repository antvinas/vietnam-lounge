// src/components/Toast.tsx
import * as Toast from "@radix-ui/react-toast";
import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";

type ToastItem = { id: number; title?: string; desc?: string };
type ToastCtx = { addToast: (t: Omit<ToastItem, "id">) => void };

const ToastContext = createContext<ToastCtx>({ addToast: () => { } });
export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const addToast = useCallback((t: Omit<ToastItem, "id">) => {
        const id = Date.now();
        setItems((prev) => [...prev, { id, ...t }]);
        const timeout = setTimeout(() => {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }, 3500);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            <Toast.Provider swipeDirection="right">
                {children}

                {items.map((t) => (
                    <Toast.Root
                        key={t.id}
                        duration={3000}
                        onOpenChange={(open) => {
                            if (!open) setItems((prev) => prev.filter((i) => i.id !== t.id));
                        }}
                        className="
              w-80 rounded-xl border border-border-subtle bg-bg-base p-3 shadow-card
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[swipe=end]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
              data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[100%]
            "
                    >
                        {t.title && (
                            <Toast.Title className="text-sm font-semibold text-fg-title">
                                {t.title}
                            </Toast.Title>
                        )}
                        {t.desc && (
                            <Toast.Description className="mt-1 text-xs text-fg-muted">
                                {t.desc}
                            </Toast.Description>
                        )}
                        <div className="mt-2 flex justify-end">
                            <Toast.Close asChild>
                                <button
                                    className="rounded-lg border border-border-subtle px-2 py-1 text-xs text-fg-muted hover:text-fg-body"
                                    aria-label="닫기"
                                >
                                    닫기
                                </button>
                            </Toast.Close>
                        </div>
                    </Toast.Root>
                ))}

                <Toast.Viewport
                    className="
            fixed bottom-4 right-4 z-[60] flex w-96 max-w-[calc(100vw-32px)] flex-col gap-2 outline-none
          "
                />
            </Toast.Provider>
        </ToastContext.Provider>
    );
}
