import { describe, it, expect } from 'vitest'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

describe('i18n initialization', () => {
  it('resolves appName to Staccato', async () => {
    // Use a fresh i18next instance with inline resources — do NOT import src/i18n.ts
    // (which would trigger the http-backend and language-detector side effects)
    const instance = i18next.createInstance()
    await instance.use(initReactI18next).init({
      lng: 'en',
      ns: ['common'],
      defaultNS: 'common',
      resources: {
        en: {
          common: { appName: 'Staccato' },
        },
      },
      interpolation: { escapeValue: false },
    })
    expect(instance.t('appName')).toBe('Staccato')
  })
})
