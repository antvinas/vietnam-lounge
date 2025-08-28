// src/components/Header.tsx
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Shield, Menu, X, Bookmark, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/ui";
import { useI18n } from "@/i18n";

export default function Header({ onOpenAdult }: { onOpenAdult: () => void }) {
    const [open, setOpen] = useState(false);
    const { bookmarks, user, signIn, signOut } = useApp();
    const navigate = useNavigate();
    const { t } = useI18n();

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            "px-3 py-2 rounded-lg text-sm font-medium",
            isActive
                ? "bg-brand-primary/10 text-brand-secondary"
                : "text-fg-muted hover:text-fg-body"
        );

    const NavLinks = (
        <>
            <NavLink to="/places" className={linkClass}>
                {t("places")}
            </NavLink>
            <NavLink to="/plans" className={linkClass}>
                {t("plans")}
            </NavLink>
            <NavLink to="/community" className={linkClass}>
                {t("community")}
            </NavLink>
            <NavLink to="/events" className={linkClass}>
                {t("events")}
            </NavLink>
            <NavLink to="/my" className={linkClass}>
                {t("my")}
            </NavLink>
        </>
    );

    return (
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link to="/" className="text-lg font-bold text-fg-title">
                    VN Lounge
                </Link>

                {/* desktop */}
                <nav className="hidden items-center gap-2 md:flex">
                    {NavLinks}

                    <span className="ml-1 inline-flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-2 text-xs text-fg-muted">
                        <Bookmark size={14} /> {bookmarks.size}
                    </span>

                    <Button variant="outline" onClick={onOpenAdult} className="ml-1 gap-1">
                        <Shield size={16} />
                        {t("adult19")}
                    </Button>

                    <div className="ml-1">
                        <ThemeToggle />
                    </div>
                    <div className="ml-1">
                        <LanguageSwitcher />
                    </div>

                    {user ? (
                        <Button
                            variant="outline"
                            className="ml-2 gap-1"
                            onClick={async () => {
                                await signOut();
                                navigate("/");
                            }}
                        >
                            <LogOut size={16} /> {t("logout")}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="ml-2 gap-1"
                            onClick={async () => {
                                await signIn();
                            }}
                        >
                            <LogIn size={16} /> {t("login")}
                        </Button>
                    )}
                </nav>

                {/* mobile toggle */}
                <Button
                    variant="outline"
                    className="p-2 md:hidden"
                    aria-label="menu"
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? <X size={18} /> : <Menu size={18} />}
                </Button>
            </div>

            {/* mobile drawer */}
            {open && (
                <div className="md:hidden border-t border-border-subtle bg-bg-base">
                    <div className="mx-auto grid max-w-6xl gap-2 px-4 py-3">
                        {NavLinks}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onOpenAdult();
                                    setOpen(false);
                                }}
                            >
                                <Shield size={16} /> {t("adult19")}
                            </Button>
                            <span className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-2 text-xs text-fg-muted">
                                <Bookmark size={14} /> {bookmarks.size}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-fg-muted" />
                            {user ? (
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        await signOut();
                                        setOpen(false);
                                        navigate("/");
                                    }}
                                >
                                    {t("logout")}
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        await signIn();
                                        setOpen(false);
                                    }}
                                >
                                    {t("login")}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
