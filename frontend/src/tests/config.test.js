import { describe, it, expect } from 'vitest'
import config from '../config'

describe('Configuration', () => {
  it('should have apiBaseUrl defined', () => {
    expect(config.apiBaseUrl).toBeDefined()
    expect(typeof config.apiBaseUrl).toBe('string')
  })

  it('should have default API URL', () => {
    expect(config.apiBaseUrl).toContain('localhost:8000/api')
  })

  it('should have environment flags', () => {
    expect(config).toHaveProperty('isDevelopment')
    expect(config).toHaveProperty('isProduction')
    expect(typeof config.isDevelopment).toBe('boolean')
    expect(typeof config.isProduction).toBe('boolean')
  })
})
