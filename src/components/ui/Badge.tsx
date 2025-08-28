import { cn } from "@/lib/ui";

export default function Badge({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1 text-xs text-fg-muted",
                className
            )}
            {...props}
        />
    );
}
