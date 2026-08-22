import { describe, it, expect } from 'vitest';
import { extractTimelineEvents, MIN_TIMELINE_EVENTS } from './timeline';

describe('extractTimelineEvents', () => {
  it('pairs years with their surrounding sentences and sorts chronologically', () => {
    const html = `<div>
      <p>In 1793 Louis XVI was executed. The revolution began in 1789 with the Estates-General.</p>
    </div>`;
    const events = extractTimelineEvents(html);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ year: 1789 });
    expect(events[0].text).toContain('Estates-General');
    expect(events[1].year).toBe(1793);
  });

  it('scans list items as well as paragraphs', () => {
    const html = '<ul><li>1945: End of World War II.</li></ul>';
    expect(extractTimelineEvents(html)[0].year).toBe(1945);
  });

  it('uses only the first year of a sentence as its anchor', () => {
    const html = '<p>From 1789 to 1799 the revolution reshaped France.</p>';
    expect(extractTimelineEvents(html)).toEqual([
      { year: 1789, text: 'From 1789 to 1799 the revolution reshaped France.' },
    ]);
  });

  it('deduplicates identical sentences', () => {
    const html = '<p>The war began in 1914.</p><p>The war began in 1914.</p>';
    expect(extractTimelineEvents(html)).toHaveLength(1);
  });

  it('ignores years outside the supported range', () => {
    // 999 and 2050 must not match; 1066 must.
    const html = '<p>In 1066 the conquest happened, unlike 999 or 2050.</p>';
    const events = extractTimelineEvents(html);
    expect(events).toHaveLength(1);
    expect(events[0].year).toBe(1066);
  });

  it('returns an empty array for articles without dates', () => {
    expect(extractTimelineEvents('<p>No dates at all in this text.</p>')).toEqual([]);
  });

  it('returns an empty array for empty html', () => {
    expect(extractTimelineEvents('')).toEqual([]);
  });

  it('applies the limit', () => {
    const paragraphs = Array.from({ length: 20 }, (_, i) => `<p>Event number ${1000 + i * 10} happened.</p>`).join('');
    expect(extractTimelineEvents(paragraphs, 5)).toHaveLength(5);
  });

  it('exposes the meaningful-timeline threshold used by the UI empty state', () => {
    // The modal shows the empty state below MIN_TIMELINE_EVENTS events.
    const html = '<p>Only one event, in 1804.</p>';
    expect(extractTimelineEvents(html).length).toBeLessThan(MIN_TIMELINE_EVENTS);
  });
});
