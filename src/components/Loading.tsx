export default function Loading() {
    return (
        <div className="grid gap-3">
            <div className="h-6 w-44 animate-pulse rounded bg-border-subtle" />
            <div className="h-28 w-full animate-pulse rounded bg-border-subtle" />
            <div className="h-28 w-full animate-pulse rounded bg-border-subtle" />
        </div>
    );
}
