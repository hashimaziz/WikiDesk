import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchEntityMetadata } from './wikipedia';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(responder: (titles: string[]) => unknown) {
  const fetchMock = vi.fn(async (_url: string) => {
    // Extract the titles param to know which batch this is.
    const url = new URL(_url);
    const titles = url.searchParams.get('titles')!.split('|');
    return { ok: true, json: async () => responder(titles) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('fetchEntityMetadata', () => {
  it('maps results back to their titles', async () => {
    stubFetch((titles) => ({
      query: {
        pages: Object.fromEntries(
          titles.map((t, i) => [i, { title: t, description: `desc of ${t}`, extract: `${t} intro`, thumbnail: { source: `img://${t}` } }]),
        ),
      },
    }));

    const result = await fetchEntityMetadata(['Einstein', 'Bohr']);
    expect(result).toEqual({
      Einstein: { description: 'desc of Einstein', extract: 'Einstein intro', thumbnail: 'img://Einstein' },
      Bohr: { description: 'desc of Bohr', extract: 'Bohr intro', thumbnail: 'img://Bohr' },
    });
  });

  it('batches requests at 20 titles each', async () => {
    const fetchMock = stubFetch((titles) => ({
      query: { pages: Object.fromEntries(titles.map((t, i) => [i, { title: t }])) },
    }));

    const titles = Array.from({ length: 45 }, (_, i) => `T${i}`);
    const result = await fetchEntityMetadata(titles);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(Object.keys(result)).toHaveLength(45);
  });

  it('skips missing pages instead of failing the whole batch', async () => {
    stubFetch(() => ({
      query: {
        pages: {
          1: { title: 'Real Article', extract: 'exists' },
          '-1': { title: 'Missing One', missing: '' },
        },
      },
    }));

    const result = await fetchEntityMetadata(['Real Article', 'Missing One']);
    expect(result).toEqual({ 'Real Article': { description: undefined, extract: 'exists', thumbnail: undefined } });
  });
});
