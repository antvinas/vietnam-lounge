import { cn } from "@/lib/ui";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
};

export default function Button({
    className,
    variant = "primary",
    size = "md",
    ...rest
}: Props) {
    const base =
        "inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-50 disabled:cursor-not-allowed";
    const pv = {
        primary: "bg-brand-primary text-white hover:opacity-90",
        outline:
            "border border-border-subtle text-fg-title hover:bg-bg-muted dark:hover:bg-bg-muted/60",
        ghost: "text-fg-muted hover:text-fg-body",
    }[variant];

    const sz = {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3.5 py-2 text-sm",
        lg: "px-4.5 py-2.5 text-base",
    }[size];

    return <button className={cn(base, pv, sz, className)} {...rest} />;
}
