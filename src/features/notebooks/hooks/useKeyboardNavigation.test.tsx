import { render, screen, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { describe, it, expect, afterEach } from 'vitest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useKeyboardNavigation } from './useKeyboardNavigation';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function TestComponent({
  dialogOpen,
}: {
  dialogOpen: boolean;
}) {
  useKeyboardNavigation('/prev', '/next');
  return (
    <>
      <LocationDisplay />
      <AlertDialog open={dialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function renderWithRouter(dialogOpen: boolean) {
  return render(
    <MemoryRouter initialEntries={['/current']}>
      <Routes>
        <Route path="/current" element={<TestComponent dialogOpen={dialogOpen} />} />
        <Route path="/prev" element={<LocationDisplay />} />
        <Route path="/next" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('useKeyboardNavigation', () => {
  afterEach(() => {
    cleanup();
  });

  it('navigates on ArrowRight when no dialog is open', () => {
    renderWithRouter(false);
    expect(screen.getByTestId('location').textContent).toBe('/current');

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
    });

    expect(screen.getByTestId('location').textContent).toBe('/next');
  });

  it('navigates on ArrowLeft when no dialog is open', () => {
    renderWithRouter(false);
    expect(screen.getByTestId('location').textContent).toBe('/current');

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
    });

    expect(screen.getByTestId('location').textContent).toBe('/prev');
  });

  it('does not navigate on ArrowRight when an AlertDialog is open', () => {
    renderWithRouter(true);
    expect(screen.getByTestId('location').textContent).toBe('/current');
    // Sanity check: the dialog is actually in the document
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
    });

    expect(screen.getByTestId('location').textContent).toBe('/current');
  });

  it('does not navigate on ArrowLeft when an AlertDialog is open', () => {
    renderWithRouter(true);
    expect(screen.getByTestId('location').textContent).toBe('/current');

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
    });

    expect(screen.getByTestId('location').textContent).toBe('/current');
  });
});
