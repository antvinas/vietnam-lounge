export default function Footer() {
    return (
        <footer className="mt-10 border-t border-border-subtle bg-bg-base">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-fg-muted md:flex-row md:items-center md:justify-between">
                <div>© {new Date().getFullYear()} Vietnam Lounge · All rights reserved.</div>
                <div className="flex gap-3">
                    <a href="/policy" className="hover:text-fg-body">이용약관</a>
                    <a href="/privacy" className="hover:text-fg-body">개인정보처리방침</a>
                    <a href="/about" className="hover:text-fg-body">소개</a>
                </div>
            </div>
        </footer>
    );
}
