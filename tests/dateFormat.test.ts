import { describe, it, expect } from 'vitest';
import { formatDate, formatHour } from '../src/app/actions/dateFormat';

describe('date format utilities', () => {
    it('formats a date string', () => {
        expect(formatDate('2024-01-15T00:00:00Z')).toBe('Mon, January 15, 2024');
    });

    it('formats a time string', () => {
        expect(formatHour('2024-01-15T13:45:00Z')).toBe('01:45 PM');
    });
});
