import * as Toast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";

type T = { id: number; title?: string; desc?: string };
type Ctx = { addToast: (t: Omit<T, "id">) => void };

const ToastCtx = createContext<Ctx>({ addToast: () => { } });
export const useToast = () => useContext(ToastCtx);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<T[]>([]);

    const addToast = useCallback((t: Omit<T, "id">) => {
        const id = Date.now();
        setItems((prev) => [...prev, { id, ...t }]);
        setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3500);
    }, []);

    return (
        <ToastCtx.Provider value={{ addToast }}>
            <Toast.Provider>
                {children}
                <div className="fixed bottom-4 right-4 grid gap-2">
                    {items.map((t) => (
                        <Toast.Root
                            key={t.id}
                            className="w-80 rounded-xl border border-border-subtle bg-bg-base p-3 shadow-card data-[state=open]:animate-in data-[state=closed]:animate-out"
                            duration={3000}
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
                        </Toast.Root>
                    ))}
                </div>
                <Toast.Viewport />
            </Toast.Provider>
        </ToastCtx.Provider>
    );
}
