import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMinWidth } from './useMinWidth';

describe('useMinWidth', () => {
  let listeners: ((e: { matches: boolean }) => void)[];
  let currentMatches: boolean;

  beforeEach(() => {
    listeners = [];
    currentMatches = true;
    vi.stubGlobal('window', {
      ...window,
      matchMedia: vi.fn((query: string) => ({
        matches: currentMatches,
        media: query,
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
        removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
          listeners = listeners.filter((l) => l !== cb);
        },
      })),
    });
  });

  it('reflects the initial match state', () => {
    const { result } = renderHook(() => useMinWidth(1024));
    expect(result.current).toBe(true);
  });

  it('updates when the viewport crosses the breakpoint and unsubscribes on unmount', () => {
    const { result, unmount } = renderHook(() => useMinWidth(1024));
    expect(result.current).toBe(true);

    act(() => {
      currentMatches = false;
      listeners.forEach((l) => l({ matches: false }));
    });
    expect(result.current).toBe(false);

    const countBefore = listeners.length;
    unmount();
    // No further updates after unmount; listener was removed.
    expect(listeners.length).toBe(countBefore - 1);
  });
});
