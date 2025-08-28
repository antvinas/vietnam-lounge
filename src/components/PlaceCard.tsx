// src/components/PlaceCard.tsx
import { Link } from "react-router-dom";
import { Card, CardTitle, CardText } from "@/components/ui/Card";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SafetyScoreWidget from "@/components/SafetyScoreWidget";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/ui";
import type { Place } from "@/types";

export default function PlaceCard({ place }: { place: Place }) {
    const { bookmarks, toggleBookmark } = useApp();
    const saved = bookmarks.has(place.id);

    return (
        <Card className="overflow-hidden p-0">
            {/* Cover */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                {place.cover ? (
                    <img
                        src={place.cover}
                        alt={`${place.name} cover`}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                        loading="lazy"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20" />
                )}
                {place.verified && (
                    <div className="absolute left-3 top-3">
                        <VerifiedBadge />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{place.name}</CardTitle>
                        <CardText className="text-sm text-fg-muted">
                            {place.city} · {place.category}
                        </CardText>
                    </div>
                </div>

                {/* Safety score */}
                <div className="mt-3">
                    <SafetyScoreWidget score={place.score} />
                </div>

                {/* Tags */}
                {place.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {place.tags.map((t) => (
                            <Badge key={t}>{t}</Badge>
                        ))}
                    </div>
                ) : null}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                    <Link to={`/place/${place.id}`} className="inline-flex">
                        <Button variant="outline">자세히</Button>
                    </Link>
                    <Button
                        onClick={() => toggleBookmark(place.id)}
                        className={cn(saved && "bg-brand-secondary")}
                    >
                        {saved ? "저장됨" : "저장"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
