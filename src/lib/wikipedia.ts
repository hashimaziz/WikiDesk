export async function fetchArticleHtml(title: string): Promise<string> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch article HTML')
  }
  return response.text()
}

export interface ArticleSummary {
  extract?: string
  thumbnail?: { source: string }
}

export async function fetchArticleSummary(title: string): Promise<ArticleSummary> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch article summary')
  }
  return response.json()
}

export interface SearchResultHit {
  pageid: number
  title: string
  snippet: string
}

export async function searchArticles(query: string, limit = 10): Promise<SearchResultHit[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=${limit}&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`
  const response = await fetch(url)
  const data = await response.json()
  return data.query.search
}

// ---- Batched metadata (smart sidebar) ----

const WIKI_API = 'https://en.wikipedia.org/w/api.php'
/** MediaWiki action=query accepts at most 20 titles per request. */
const TITLES_PER_REQUEST = 20

export interface EntityMeta {
  description?: string
  extract?: string
  thumbnail?: string
}

/**
 * Fetches description / intro extract / thumbnail for many titles using the
 * batched action=query API — one network round-trip per 20 titles instead of
 * one per title with the REST summary endpoint.
 */
export async function fetchEntityMetadata(titles: string[]): Promise<Record<string, EntityMeta>> {
  const result: Record<string, EntityMeta> = {}
  for (let i = 0; i < titles.length; i += TITLES_PER_REQUEST) {
    const batch = titles.slice(i, i + TITLES_PER_REQUEST)
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      prop: 'pageimages|description|extracts',
      exintro: '1',
      explaintext: '1',
      piprop: 'thumbnail',
      pithumbsize: '64',
      titles: batch.join('|'),
    })
    const response = await fetch(`${WIKI_API}?${params}`)
    if (!response.ok) continue
    const data = await response.json()
    interface QueryPage {
      title?: string
      missing?: string
      description?: string
      extract?: string
      thumbnail?: { source: string }
    }
    const pages = (data?.query?.pages ?? {}) as Record<string, QueryPage>
    for (const page of Object.values(pages)) {
      const title = page.title
      if (!title || page.missing !== undefined) continue
      result[title] = {
        description: page.description,
        extract: page.extract,
        thumbnail: page.thumbnail?.source,
      }
    }
  }
  return result
}
