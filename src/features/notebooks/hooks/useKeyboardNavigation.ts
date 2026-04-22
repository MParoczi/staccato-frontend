import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function useKeyboardNavigation(
  prevUrl: string | null,
  nextUrl: string | null,
): void {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Suppress when focus is on input, textarea, or contenteditable elements
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Suppress when a modal dialog (Dialog/AlertDialog) is open
      if (
        document.querySelector(
          '[role="dialog"], [role="alertdialog"], [aria-modal="true"]',
        )
      ) {
        return;
      }

      if (event.key === 'ArrowLeft' && prevUrl) {
        void navigate(prevUrl);
      } else if (event.key === 'ArrowRight' && nextUrl) {
        void navigate(nextUrl);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, prevUrl, nextUrl]);
}
