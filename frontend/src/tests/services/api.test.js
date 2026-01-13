import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '../../services/api'

// Mock fetch
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('GET requests', () => {
    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await api.get('/test')

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(mockData)
    })
  })

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      const mockData = { id: 1, name: 'Created' }
      const postData = { name: 'New Item' }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await api.post('/test', postData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData)
        })
      )
      expect(result).toEqual(mockData)
    })
  })

  describe('Error handling', () => {
    it('should handle 404 errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      })

      await expect(api.get('/not-found')).rejects.toThrow()
    })

    it('should handle 204 No Content', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const result = await api.delete('/test/1')
      expect(result).toBeNull()
    })
  })
})
