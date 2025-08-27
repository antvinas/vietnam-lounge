import { cn } from '../../lib/ui'
export default function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={cn('rounded-md border border-border-subtle px-2 py-1 text-xs text-fg-muted', className)} {...props} />
}
