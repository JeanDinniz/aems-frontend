// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useLocalStorage', () => {
    console.log('Window type:', typeof window);
    try {
        console.log('LocalStorage:', window.localStorage);
    } catch (e) {
        console.log('Error accessing localStorage:', e);
    }

    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('should return initial value if no value in localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
        expect(result.current[0]).toBe('initial');
    });

    it('should return stored value if value exists in localStorage', () => {
        window.localStorage.setItem('test-key', JSON.stringify('stored'));
        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
        expect(result.current[0]).toBe('stored');
    });

    it('should update localStorage when setValue is called', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

        act(() => {
            result.current[1]('new value');
        });

        expect(result.current[0]).toBe('new value');
        expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('new value'));
    });

    it('should handle function updates', () => {
        const { result } = renderHook(() => useLocalStorage<number>('count', 0));

        act(() => {
            result.current[1]((prev) => prev + 1);
        });

        expect(result.current[0]).toBe(1);
        expect(window.localStorage.getItem('count')).toBe(JSON.stringify(1));
    });
});
