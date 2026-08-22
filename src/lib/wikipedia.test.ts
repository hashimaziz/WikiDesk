import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchEntityMetadata,
  absolutizeProtocolRelativeUrls,
  extractArticleBody,
} from './wikipedia';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('extractArticleBody', () => {
  it('strips the head: base tag, MediaWiki stylesheets, meta tags', () => {
    const html = `<!DOCTYPE html><html><head>
      <base href="//en.wikipedia.org/wiki/"/>
      <link rel="stylesheet" href="/w/load.php?modules=mediawiki.skinning&skin=vector"/>
      <meta charset="utf-8">
    </head><body data-parsoid="x"><h2>Lead section</h2><p>Text</p></body></html>`;
    const body = extractArticleBody(html);
    expect(body).toContain('<h2>Lead section</h2>');
    expect(body).not.toContain('base');
    expect(body).not.toContain('load.php');
    expect(body).not.toContain('<meta');
  });

  it('keeps template style blocks that live inside the body', () => {
    const html = '<body><style>.tpl .col{width:50%}</style><div class="tpl">x</div></body>';
    expect(extractArticleBody(html)).toContain('.tpl .col');
  });
});

describe('absolutizeProtocolRelativeUrls', () => {
  it('pins protocol-relative img srcs to https', () => {
    const html = '<img src="//upload.wikimedia.org/wikipedia/commons/a.jpg" alt="x">';
    expect(absolutizeProtocolRelativeUrls(html)).toBe(
      '<img src="https://upload.wikimedia.org/wikipedia/commons/a.jpg" alt="x">',
    );
  });

  it('rewrites every candidate in a srcset attribute', () => {
    const html = '<img srcset="//a.org/1.jpg 1x, //b.org/2.jpg 2x">';
    const result = absolutizeProtocolRelativeUrls(html);
    expect(result).toContain('srcset="https://a.org/1.jpg 1x, https://b.org/2.jpg 2x"');
  });

  it('leaves already-absolute and relative URLs untouched', () => {
    const html = '<img src="https://x.org/a.png"><a href="./Other_Page">y</a><img src="/local.png">';
    expect(absolutizeProtocolRelativeUrls(html)).toBe(html);
  });

  it('rewrites css url() references', () => {
    expect(absolutizeProtocolRelativeUrls('<div style="background:url(//c.org/i.png)">')).toBe(
      '<div style="background:url(https://c.org/i.png)">',
    );
  });
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
