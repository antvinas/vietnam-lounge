import * as Dialog from "@radix-ui/react-dialog";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function ReportDialog({
    onReport,
    trigger,
}: {
    onReport: (reason: string) => Promise<void>;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const { addToast } = useToast();

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-bg-base p-6 shadow-card">
                    <Dialog.Title className="mb-2 text-lg font-bold text-fg-title">신고하기</Dialog.Title>
                    <p className="mb-2 text-sm text-fg-muted">
                        연락처/알선/노골적 콘텐츠/사기 의심 등 정책 위반 신고를 받습니다.
                    </p>
                    <textarea
                        className="mb-3 h-28 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm"
                        placeholder="사유를 입력하세요"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!reason.trim()) return;
                                await onReport(reason);
                                addToast({ title: "신고 접수", desc: "검토 후 조치됩니다." });
                                setReason("");
                                setOpen(false);
                            }}
                        >
                            제출
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
