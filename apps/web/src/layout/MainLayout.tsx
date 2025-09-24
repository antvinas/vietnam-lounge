import { ReactNode } from "react";
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

const MainLayout = ({ children, title, description }: Props) => {
  const { contentMode } = useUiStore();
  const isNightlife = contentMode === "nightlife";

  return (
    <div
      className={`flex min-h-screen flex-col transition-colors duration-300 ${
        isNightlife ? "bg-[#0E1526] text-white" : "bg-white text-black"
      }`}
    >
      <Helmet>
        <title>{title ? `${title} | Vietnam Lounge` : "Vietnam Lounge"}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>

      {/* Header */}
      <Header />

      {/* Main */}
      <main className="flex-grow pt-16">
        <div className="mx-auto w-full px-4 sm:px-6 md:px-10 lg:px-20 xl:px-24">
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
