import { ReactNode, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import useUiStore from "@/store/ui.store";

interface Props {
  children?: ReactNode;
  title?: string;
  description?: string;
}

const AdultLayout = ({ children, title, description }: Props) => {
  const { isGatePassed } = useUiStore();

  useEffect(() => {
    if (!isGatePassed) {
      console.warn("⚠️ 성인 게이트 미통과 → 리다이렉트 필요");
    }
  }, [isGatePassed]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0E1526] text-white">
      <Helmet>
        <title>
          {title
            ? `${title} | Vietnam Lounge - Nightlife`
            : "Vietnam Lounge - Nightlife"}
        </title>
        {description && <meta name="description" content={description} />}
        {/* ✅ Nightlife 페이지는 검색엔진 색인 방지 */}
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Nightlife 전용 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="flex-grow pt-16">
        <div className="mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-20 xl:px-24">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Nightlife 푸터 */}
      <Footer />
    </div>
  );
};

export default AdultLayout;
