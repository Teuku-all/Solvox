import { useCallback, useEffect, useRef, useState } from 'react';

const EXIT_DURATION_MS = 190;

export default function useAnimatedDismiss(onClose) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);
  const closingRef = useRef(false);

  const dismiss = useCallback((afterClose = onClose) => {
    if (closingRef.current) return;
    closingRef.current = true;
    const reducedMotion = document.documentElement.classList.contains('reduced-motion')
      || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      afterClose?.();
      return;
    }
    setClosing(true);
    timerRef.current = window.setTimeout(() => afterClose?.(), EXIT_DURATION_MS);
  }, [onClose]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { closing, dismiss };
}
