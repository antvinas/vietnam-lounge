import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Img = { src: string; alt?: string };

type Props = {
  images: Img[];
  isOpen: boolean;
  startIndex?: number;
  onClose: () => void;
};

export default function Lightbox({ images, isOpen, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => setIndex(startIndex), [startIndex, isOpen]);

  if (!isOpen) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const portalRoot =
    document.getElementById("lightbox-root") ||
    (() => {
      const el = document.createElement("div");
      el.id = "lightbox-root";
      document.body.appendChild(el);
      return el;
    })();

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] bg-black/90 text-white"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M18.3 5.7a1 1 0 00-1.4-1.4L12 9.2 7.1 4.3A1 1 0 105.7 5.7L10.6 10l-4.9 4.9a1 1 0 101.4 1.4L12 11.4l4.9 4.9a1 1 0 001.4-1.4L13.4 10l4.9-4.9z"/>
        </svg>
      </button>

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <img
          src={images[index]?.src}
          alt={images[index]?.alt ?? ""}
          className="max-h-[90vh] max-w-[90vw] object-contain select-none"
          draggable={false}
          loading="eager"
          decoding="async"
          sizes="(min-width:1024px) 90vw, 100vw"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            aria-label="이전"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M15.4 4.6a1 1 0 010 1.4L10.4 11l5 5a1 1 0 11-1.4 1.4l-5.7-5.7a1 1 0 010-1.4l5.7-5.7a1 1 0 011.4 0z"/>
            </svg>
          </button>
          <button
            aria-label="다음"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M8.6 19.4a1 1 0 010-1.4l5-5-5-5A 1 1 0 1110 6.6l5.7 5.7a1 1 0 010 1.4L10 19.4a1 1 0 01-1.4 0z"/>
            </svg>
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`이미지 ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>,
    portalRoot
  );
}
