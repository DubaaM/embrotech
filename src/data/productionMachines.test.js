import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('production content is complete in both languages', () => {
  for (const language of ['sk', 'en']) {
    const translations = JSON.parse(readFileSync(new URL(`../i18n/${language}.json`, import.meta.url), 'utf8'))
    const production = translations.production
    for (const value of [production.title, production.description, production.openPhoto, production.closePhoto, production.cta.title, production.cta.description, production.cta.button]) {
      assert.ok(typeof value === 'string' && value.trim(), `${language}: missing production text`)
    }

    assert.deepEqual(Object.keys(production.machines), ['machine1', 'machine2', 'machine3', 'machine4'])
    for (const machine of Object.values(production.machines)) {
      for (const value of [machine.name, machine.alt, machine.description, machine.specs.heads, machine.specs.needles, machine.specs.area, machine.specs.speed]) {
        assert.ok(typeof value === 'string' && value.trim(), `${language}: missing machine text`)
      }
    }
  }
})
