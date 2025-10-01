export default function ShareBar() {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const copy = async () => { try { await navigator.clipboard.writeText(url); alert('링크가 복사되었습니다.'); } catch{} };
  return (
    <div className="sticky bottom-4 right-4 z-20 flex flex-wrap gap-2">
      <button onClick={copy} className="px-4 py-2 rounded-full shadow bg-slate-900 text-white">공유 링크</button>
      <button className="px-4 py-2 rounded-full border bg-white dark:bg-slate-800">PDF</button>
      <button className="px-4 py-2 rounded-full border bg-white dark:bg-slate-800">ICS</button>
    </div>
  );
}
