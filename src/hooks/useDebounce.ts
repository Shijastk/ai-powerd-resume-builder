import { useState, useEffect } from 'react';

/**
 * A hook that returns a debounced version of the provided value.
 * Useful for expensive rendering tasks like live previews.
 * 
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // If delay is 0, update immediately
        if (delay === 0) {
            setDebouncedValue(value);
            return;
        }

        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
