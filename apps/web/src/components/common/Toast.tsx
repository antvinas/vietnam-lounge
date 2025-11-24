import { Toaster } from "react-hot-toast";

/** 전역 토스트 래퍼: 루트에 1회만 렌더 */
export default function Toast() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: { fontSize: "13px" },
      }}
    />
  );
}

/* 필요 시 다른 곳에서 toast() 쓰게 하려면:
   import { toast } from "@/components/common/ToastHelpers";
*/
