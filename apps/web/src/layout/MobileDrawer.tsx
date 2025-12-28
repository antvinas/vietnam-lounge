// apps/web/src/layout/MobileDrawer.tsx

import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { FaTimes, FaHome, FaMapMarkedAlt, FaCalendarAlt, FaUser } from "react-icons/fa";
import { useUrlState } from "@/hooks/useUrlState";

const regionOptions = [
  { label: "전체", value: "ALL" },
  { label: "호치민", value: "hcm" },
  { label: "하노이", value: "hanoi" },
  { label: "다낭", value: "danang" },
  { label: "나트랑", value: "nhatrang" },
  { label: "푸꾸옥", value: "phuquoc" },
];

interface Props { isOpen: boolean; onClose: () => void; }

export default function MobileDrawer({ isOpen, onClose }: Props) {
  const { pathname } = useLocation();
  // 🟢 [수정] useUrlState는 배열 반환 ([state, setState])
  const [urlState, setUrlState] = useUrlState({ region: "ALL", category: "ALL" });

  const menuItems = [
    { label: "홈", path: "/", icon: <FaHome /> },
    { label: "장소", path: "/spots", icon: <FaMapMarkedAlt /> },
    { label: "일정", path: "/plan", icon: <FaCalendarAlt /> },
    { label: "마이", path: "/profile", icon: <FaUser /> },
  ];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
              <div className="flex px-4 pt-5 pb-2 justify-between items-center border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
                <button type="button" className="-m-2 p-2 text-gray-400" onClick={onClose}>
                  <FaTimes className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-500 mb-3">지역 선택</h3>
                <div className="flex flex-wrap gap-2">
                  {regionOptions.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setUrlState({ region: value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        urlState.region === value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 py-6 px-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-2 py-3 text-base font-medium rounded-md ${
                      pathname === item.path ? "bg-gray-100 text-blue-600" : "text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={onClose}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}