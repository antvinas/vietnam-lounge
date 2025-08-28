// src/components/ReviewCard.tsx
import { Card } from "@/components/ui/Card";
import { Star } from "lucide-react";
import type { Review } from "@/types";

function Stars({ rating }: { rating: number }) {
    const full = Math.round(rating);
    return (
        <div className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    size={14}
                    className={i < full ? "fill-brand-accent text-brand-accent" : "text-border-strong"}
                />
            ))}
            <span className="ml-1 text-xs text-fg-muted">{rating.toFixed(1)}</span>
        </div>
    );
}

function Avatar({ name }: { name: string }) {
    const ch = (name?.trim()?.[0] ?? "@").toUpperCase();
    return (
        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-secondary">
            {ch}
        </div>
    );
}

export default function ReviewCard({ review }: { review: Review }) {
    return (
        <Card>
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar name={review.user} />
                    <span className="text-sm font-medium text-fg-title">{review.user}</span>
                </div>
                <Stars rating={review.rating} />
            </div>
            <p className="text-sm text-fg-body">{review.text}</p>
            <div className="mt-2 text-[11px] text-fg-muted">{review.createdAt}</div>
        </Card>
    );
}
