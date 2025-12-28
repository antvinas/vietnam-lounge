import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import useSpotStore from "@/features/spot/stores/spot.store";

interface Props {
  children?: ReactNode;
  title?: string;
  description?: string;
}

const MainLayout = ({ children, title, description }: Props) => {
  const { spots } = useSpotStore();
  const location = useLocation();

  // spots 페이지에서는 전역 위젯 렌더링 금지
  const isSpotsRoute =
    location.pathname.startsWith("/spots") ||
    location.pathname.startsWith("/adult/spots");

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-main transition-colors duration-500 ease-in-out">
      <Helmet>
        <title>{title ? `${title} | Vietnam Lounge` : "Vietnam Lounge"}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>

      <Header />

      <main className="relative flex-grow pt-16 transition-all duration-500">
        <div className="mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-20 xl:px-24">
          {children ?? <Outlet />}
        </div>

        {/* 전역 위젯 제거: spots 라우트에서는 렌더링 안 함 */}
        {!isSpotsRoute && <div className="pointer-events-none" aria-hidden />}
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
