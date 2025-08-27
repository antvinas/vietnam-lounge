import { Suspense, useEffect, useState, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import AdultGate from './components/AdultGate'
import Loading from './components/Loading'
import AppProvider from './context/AppContext'

const Home = lazy(() => import('./pages/Home'))
const Places = lazy(() => import('./pages/Places'))
const Plans = lazy(() => import('./pages/Plans'))
const Community = lazy(() => import('./pages/Community'))
const Events = lazy(() => import('./pages/Events'))
const My = lazy(() => import('./pages/My'))
const Adult = lazy(() => import('./pages/Adult'))
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
    const [adultOpen, setAdultOpen] = useState(false)
    useEffect(() => {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', prefersDark)
    }, [])

    return (
        <AppProvider>
            <div className="min-h-screen bg-bg-base">
                <Header onOpenAdult={() => setAdultOpen(true)} />
                <main className="mx-auto max-w-6xl px-4 py-6">
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/places" element={<Places />} />
                            <Route path="/place/:id" element={<PlaceDetail />} />
                            <Route path="/plans" element={<Plans />} />
                            <Route path="/community" element={<Community />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/my" element={<My />} />
                            <Route path="/adult" element={<Adult />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </main>
                <Footer />
                <AdultGate open={adultOpen} onOpenChange={setAdultOpen} />
            </div>
        </AppProvider>
    )
}
