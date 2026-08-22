export async function fetchArticleHtml(title: string): Promise<string> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch article HTML')
  }
  return response.text()
}

export async function fetchArticleSummary(title: string) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch article summary')
  }
  return response.json()
}

export async function searchArticles(query: string, limit = 10) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=${limit}&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`
  const response = await fetch(url)
  const data = await response.json()
  return data.query.search
}
