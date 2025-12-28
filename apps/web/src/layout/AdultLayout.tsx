// src/layout/AdultLayout.tsx
import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

interface Props {
  children?: ReactNode;
  title?: string;
  description?: string;
}

const AdultLayout = ({ children, title, description }: Props) => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0E1526] text-white transition-colors duration-500">
      <Helmet>
        <title>
          {title
            ? `${title} | Vietnam Lounge - Nightlife`
            : "Vietnam Lounge - Nightlife"}
        </title>
        {description && <meta name="description" content={description} />}
        {/* 성인 섹션 검색 인덱싱 차단 */}
        <meta name="robots" content="noindex" />
      </Helmet>

      <Header />

      <main className="flex-grow pt-16">
        <div className="mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-20 xl:px-24">
          {children ?? <Outlet />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdultLayout;
