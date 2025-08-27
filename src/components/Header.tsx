import { Link, NavLink } from 'react-router-dom'
import { Moon, Sun, Shield, Menu, Bookmark } from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button'
import { useApp } from '../context/AppContext'

export default function Header({ onOpenAdult }: { onOpenAdult: () => void }) {
    const [open, setOpen] = useState(false)
    const { bookmarks } = useApp()
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-primary/10 text-brand-secondary' : 'text-fg-muted hover:text-fg-body'}`
    const toggleTheme = () => document.documentElement.classList.toggle('dark')

    return (
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link to="/" className="text-lg font-bold text-fg-title">VN Lounge</Link>
                <nav className="hidden items-center gap-1 md:flex">
                    <NavLink to="/places" className={linkClass}>장소</NavLink>
                    <NavLink to="/plans" className={linkClass}>플랜</NavLink>
                    <NavLink to="/community" className={linkClass}>커뮤니티</NavLink>
                    <NavLink to="/events" className={linkClass}>이벤트</NavLink>
                    <NavLink to="/my" className={linkClass}>마이</NavLink>

                    <span className="ml-2 inline-flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-2 text-xs text-fg-muted">
                        <Bookmark size={14} /> {bookmarks.size}
                    </span>

                    <Button variant="outline" onClick={onOpenAdult} className="ml-1 gap-1"><Shield size={16} />19+</Button>
                    <Button variant="outline" aria-label="toggle theme" onClick={toggleTheme} className="ml-2 p-2">
                        <Sun className="hidden dark:block" size={16} /><Moon className="dark:hidden" size={16} />
                    </Button>
                </nav>

                {/* mobile */}
                <Button variant="outline" className="md:hidden p-2" aria-label="menu" onClick={() => setOpen(v => !v)}>
                    <Menu size={18} />
                </Button>
            </div>

            {open && (
                <div className="md:hidden border-t border-border-subtle bg-bg-base">
                    <div className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
                        <Link to="/places" className="py-2 text-fg-body" onClick={() => setOpen(false)}>장소</Link>
                        <Link to="/plans" className="py-2 text-fg-body" onClick={() => setOpen(false)}>플랜</Link>
                        <Link to="/community" className="py-2 text-fg-body" onClick={() => setOpen(false)}>커뮤니티</Link>
                        <Link to="/events" className="py-2 text-fg-body" onClick={() => setOpen(false)}>이벤트</Link>
                        <Link to="/my" className="py-2 text-fg-body" onClick={() => setOpen(false)}>마이</Link>
                        <Button variant="outline" onClick={() => { onOpenAdult(); setOpen(false) }}>성인 19+</Button>
                    </div>
                </div>
            )}
        </header>
    )
}
