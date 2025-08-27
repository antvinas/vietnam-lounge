import * as Dialog from '@radix-ui/react-dialog'

export default function AdultGate({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-bg-base p-6 shadow-card">
                    <Dialog.Title className="mb-2 text-lg font-bold text-fg-title">성인(19+) 섹션 안내</Dialog.Title>
                    <p className="mb-4 text-sm text-fg-body">
                        야간 장소의 정보·후기만 허용. 연락처 교환/알선성 게시물/노골적 콘텐츠는 금지되며 위반 시 즉시 제재됩니다.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button className="rounded-lg border border-border-subtle px-3 py-2 text-sm" onClick={() => onOpenChange(false)}>취소</button>
                        <a href="/adult" className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white" onClick={() => onOpenChange(false)}>동의하고 보기</a>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
