import { describe, expect, it } from 'vitest'
import { assertValidAppUrl, getSafeExternalUrl } from '../main/url-policy'

describe('url-policy', () => {
  it('accepts https app urls', () => {
    expect(assertValidAppUrl('https://mail.google.com').toString()).toBe('https://mail.google.com/')
  })

  it('rejects non-https app urls', () => {
    expect(() => assertValidAppUrl('http://127.0.0.1:3000')).toThrow('Only HTTPS app URLs are allowed.')
    expect(() => assertValidAppUrl('file:///tmp/test.html')).toThrow('Only HTTPS app URLs are allowed.')
  })

  it('allows only approved external url schemes', () => {
    expect(getSafeExternalUrl('https://example.com/path')).toBe('https://example.com/path')
    expect(getSafeExternalUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(getSafeExternalUrl('file:///tmp/test')).toBeNull()
  })
})
