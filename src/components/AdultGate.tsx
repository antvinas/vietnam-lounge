import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Button from "@/components/ui/Button";

export default function AdultGate({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const navigate = useNavigate();
    const { setAdultAllowed } = useApp();

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-bg-base p-6 shadow-card">
                    <Dialog.Title className="mb-2 text-lg font-bold text-fg-title">
                        성인(19+) 섹션 안내
                    </Dialog.Title>
                    <p className="mb-4 text-sm text-fg-body">
                        야간 장소의 정보·후기만 허용. 연락처 교환/알선성 게시물/노골적 콘텐츠는 금지되며 위반 시 즉시 제재됩니다.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={() => {
                                setAdultAllowed(true);
                                onOpenChange(false);
                                navigate("/adult");
                            }}
                        >
                            동의하고 보기
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
