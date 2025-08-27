import { createContext, useContext, useMemo, useState } from 'react'
import { getBookmarks, toggleBookmark } from '../lib/api'

type Ctx = { bookmarks: Set<string>; toggle: (id: string) => void }
const AppCtx = createContext<Ctx>({ bookmarks: new Set(), toggle: () => { } })
export const useApp = () => useContext(AppCtx)

export default function AppProvider({ children }: { children: React.ReactNode }) {
    const [bookmarks, setBookmarks] = useState<Set<string>>(getBookmarks())
    const value = useMemo<Ctx>(() => ({
        bookmarks,
        toggle: (id: string) => setBookmarks(new Set(toggleBookmark(id))),
    }), [bookmarks])
    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
