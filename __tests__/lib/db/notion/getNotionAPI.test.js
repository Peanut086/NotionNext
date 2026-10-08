const DEFAULT_API_BASE_URL = 'https://app.notion.com/api/v3'

const USER_AGENT = {
  'User-Agent': 'NotionNext (+https://github.com/NotionNext/NotionNext)'
}

/** 用给定的 API_BASE_URL 加载 getNotionAPI，并返回被 mock 的构造器 */
async function loadWithApiBaseUrl(apiBaseUrl) {
  jest.resetModules()

  const NotionAPI = jest.fn().mockImplementation(() => ({
    getPage: jest.fn().mockResolvedValue({})
  }))
  jest.doMock('notion-client', () => ({ NotionAPI }))
  jest.doMock('@/blog.config', () => ({
    ...jest.requireActual('@/blog.config'),
    API_BASE_URL: apiBaseUrl
  }))

  const notionAPI = require('@/lib/db/notion/getNotionAPI').default
  await notionAPI.getPage('page-id')
  return NotionAPI
}

describe('getNotionAPI', () => {
  it('passes the configured API_BASE_URL to notion-client', async () => {
    const NotionAPI = await loadWithApiBaseUrl(
      'https://example-blog.notion.site/api/v3'
    )

    expect(NotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: 'https://example-blog.notion.site/api/v3',
        ofetchOptions: { headers: USER_AGENT }
      })
    )
  })

  it('falls back to the official host when API_BASE_URL is empty', async () => {
    const NotionAPI = await loadWithApiBaseUrl('')

    expect(NotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        ofetchOptions: { headers: USER_AGENT }
      })
    )
  })
})
