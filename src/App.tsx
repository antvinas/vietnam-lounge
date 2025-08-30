import { Suspense, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { routes } from "@/routes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdultGate from "@/components/AdultGate";
import Loading from "@/components/Loading";
import { useApp } from "@/context/AppContext";

export default function App() {
    const [adultOpen, setAdultOpen] = useState(false);
    const { adultAllowed, setAdultAllowed } = useApp();

    // 앱 최초 진입 시 성인게이트 1회만 노출(동의 안한 경우)
    useEffect(() => {
        if (!adultAllowed) setAdultOpen(true);
    }, [adultAllowed]);

    return (
        <div className="min-h-screen bg-bg-base text-fg-body">
            <Header onOpenAdult={() => setAdultOpen(true)} />
            <main className="mx-auto max-w-6xl px-4 py-6">
                <Suspense fallback={<Loading />}>
                    <Routes>
                        {routes.map(({ path, Component }) => (
                            <Route key={path} path={path} element={<Component />} />
                        ))}
                    </Routes>
                </Suspense>
            </main>
            <Footer />

            <AdultGate
                open={adultOpen}
                onOpenChange={(open) => {
                    setAdultOpen(open);
                    // Adult 페이지 진입 버튼에서 동의 처리 → AdultGate 내부 링크에서 처리됨.
                    // 여기서는 닫기만 담당.
                }}
            />
        </div>
    );
}