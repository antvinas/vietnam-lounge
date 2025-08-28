import { CheckCircle2 } from "lucide-react";

export default function VerifiedBadge() {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent/20 px-3 py-1 text-xs font-medium text-brand-secondary">
            <CheckCircle2 size={14} /> Verified
        </span>
    );
}
