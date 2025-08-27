import { cn } from '../../lib/ui'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' }
export default function Button({ className, variant = 'primary', ...rest }: Props) {
    const base = 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition'
    const styles = {
        primary: 'bg-brand-primary text-white hover:opacity-90',
        outline: 'border border-border-subtle text-fg-title hover:bg-bg-muted',
        ghost: 'text-fg-muted hover:text-fg-body'
    }[variant]
    return <button className={cn(base, styles, className)} {...rest} />
}
