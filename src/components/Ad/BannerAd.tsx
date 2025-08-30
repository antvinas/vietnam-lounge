import React, { useEffect, useRef } from 'react';

declare global { interface Window { adsbygoogle: any[] } }

export default function BannerAd() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ok = localStorage.getItem('consent_ok') === '1';
    if (!ok) return;
    const el = ref.current;
    if (!el) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + (import.meta.env.VITE_ADSENSE_CLIENT || '');
    script.crossOrigin = 'anonymous';
    script.onload = () => { (window.adsbygoogle = window.adsbygoogle || []).push({}); };
    el.appendChild(script);
    return () => { el.innerHTML = ''; };
  }, []);
  return <div ref={ref} className="w-full flex justify-center min-h-[90px]" />;
}
