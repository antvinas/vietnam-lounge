// src/components/ReviewForm.tsx
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Star } from "lucide-react";
import { useToast } from "@/components/Toast";

type Props = {
    onSubmit: (user: string, rating: number, text: string) => Promise<void>;
    defaultUser?: string;
};

export default function ReviewForm({ onSubmit, defaultUser = "@guest" }: Props) {
    const [user, setUser] = useState(defaultUser);
    const [rating, setRating] = useState(4);
    const [hover, setHover] = useState<number | null>(null);
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const { addToast } = useToast();

    const current = hover ?? rating;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            setBusy(true);
            await onSubmit(user, rating, text.trim());
            setText("");
            addToast({ title: "리뷰 등록", desc: "성공적으로 등록되었습니다." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-1 text-sm">
                <label className="text-fg-muted">닉네임</label>
                <input
                    className="rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    required
                />
            </div>

            <div className="grid gap-1 text-sm">
                <label className="text-fg-muted">평점</label>
                <div className="inline-flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const n = i + 1;
                        const active = n <= current;
                        return (
                            <button
                                key={n}
                                type="button"
                                aria-label={`별점 ${n}`}
                                onMouseEnter={() => setHover(n)}
                                onMouseLeave={() => setHover(null)}
                                onClick={() => setRating(n)}
                                className="p-1"
                            >
                                <Star
                                    size={20}
                                    className={active ? "fill-brand-accent text-brand-accent" : "text-border-strong"}
                                />
                            </button>
                        );
                    })}
                    <span className="ml-1 text-xs text-fg-muted">{current}/5</span>
                </div>
            </div>

            <div className="grid gap-1 text-sm">
                <label className="text-fg-muted">리뷰</label>
                <textarea
                    className="min-h-[100px] rounded-xl border border-border-subtle bg-white px-3 py-2 dark:bg-bg-muted"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="분위기, 가격, 응대, 꿀팁 등을 적어주세요."
                    required
                />
            </div>

            <Button type="submit" disabled={busy} className="w-fit">
                {busy ? "등록 중..." : "등록"}
            </Button>
        </form>
    );
}
