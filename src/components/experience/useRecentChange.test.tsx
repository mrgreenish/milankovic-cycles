import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useRecentChange } from "./useRecentChange";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("stays on while a control keeps moving and lets go a moment after the last move", () => {
  const { result } = renderHook(() => useRecentChange(1000));
  expect(result.current[0]).toBe(false);

  act(() => result.current[1]());
  expect(result.current[0]).toBe(true);

  // A drag keeps marking; each move restarts the wait.
  for (let step = 0; step < 5; step++) {
    act(() => {
      vi.advanceTimersByTime(600);
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);
  }

  act(() => vi.advanceTimersByTime(999));
  expect(result.current[0]).toBe(true);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current[0]).toBe(false);
});

it("does not report after the page has gone", () => {
  const { result, unmount } = renderHook(() => useRecentChange(1000));
  act(() => result.current[1]());
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
