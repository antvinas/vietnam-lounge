import { cn } from '../../lib/ui'
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('rounded-2xl border border-border-subtle bg-white p-4 shadow-card dark:bg-bg-muted', className)} {...props} />
}
export const CardTitle = (p: React.HTMLAttributes<HTMLDivElement>) => <div className="mb-2 text-lg font-bold text-fg-title" {...p} />
export const CardText = (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="text-sm text-fg-body" {...p} />
