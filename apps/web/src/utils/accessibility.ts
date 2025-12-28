export function getFocusable(container: HTMLElement): HTMLElement[] {
  const sel =
    'a[href], button, textarea, input, select, details,[tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
  );
}

export function trapFocus(container: HTMLElement): () => void {
  const focusables = () => getFocusable(container);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const list = focusables();
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  };
  container.addEventListener('keydown', onKey);
  // 초기 포커스
  const list = getFocusable(container);
  if (list[0]) list[0].focus();
  return () => container.removeEventListener('keydown', onKey);
}

export function onEnterSpace(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
}

export function moveFocus(container: HTMLElement, delta: 1 | -1) {
  const list = getFocusable(container);
  if (!list.length) return;
  const idx = Math.max(0, list.indexOf(document.activeElement as HTMLElement));
  const next = list[(idx + delta + list.length) % list.length];
  next?.focus();
}
