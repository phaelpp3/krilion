import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { QUESTIONS } from '../src/data/questions'
import { DAILY_STORAGE_PREFIX, getDailyQuestions } from '../src/lib/game'
import { THEMES } from '../src/lib/preferences'
import { STATISTICS_STORAGE_KEY } from '../src/lib/statistics'

const DATE = '2026-10-26'
const NOW = new Date(`${DATE}T15:00:00Z`)
const errors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const pageErrors: string[] = []
  errors.set(page, pageErrors)
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.clock.install({ time: NOW })
})

test.afterEach(async ({ page }) => {
  expect(errors.get(page), 'The application must not throw browser errors').toEqual([])
})

async function start(page: Page) {
  await page.getByRole('button', { name: 'Começar a mergulhar' }).click()
  await expect(page.getByLabel('Sua resposta mais rara')).toBeFocused()
}

async function answer(page: Page, value: string) {
  await page.getByLabel('Sua resposta mais rara').fill(value)
  await page.getByRole('button', { name: 'Mergulhar', exact: true }).click()
}

test('completes all seven daily questions, persists 7000 m and counts one daily game', async ({ page }) => {
  await page.goto('/')
  await start(page)
  const questions = getDailyQuestions(DATE)
  for (const [index, question] of questions.entries()) {
    await expect(page.getByRole('heading', { name: question.prompt, exact: true })).toBeVisible()
    const rarest = [...question.answers].sort((left, right) => right.rarity - left.rarity)[0]
    expect(rarest.rarity).toBe(1)
    await answer(page, rarest.label)
    if (index < questions.length - 1) {
      await expect(page.getByText('+1.000')).toBeVisible()
      await page.getByRole('button', { name: `Próxima pergunta · ${index + 2}/7` }).click()
    }
  }
  await expect(page.getByText('EXPEDIÇÃO CONCLUÍDA', { exact: true })).toBeVisible()
  await expect(page.locator('.game-total')).toHaveText('7.000 m')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Clipboard unavailable') } }, configurable: true })
  })
  await page.getByRole('button', { name: 'Compartilhar resultado' }).click()
  await expect(page.getByRole('textbox', { name: 'Resultado para copiar' })).toHaveValue(/Krilion · 2026-10-26\n7\.000 m \/ 7\.000 m/)
  await expect(page.getByText('de 7.000 metros possíveis · 7 de 7 respostas válidas')).toBeVisible()
  await page.reload()
  await expect(page.locator('.game-total')).toHaveText('7.000 m')
  await page.getByRole('button', { name: 'Estatísticas', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.game-stats-grid > div').filter({ hasText: 'diários concluídos' })).toHaveText('1diários concluídos')
  await expect(page.locator('.game-stats-grid > div').filter({ hasText: 'de respostas válidas' })).toContainText('100%')
  const stats = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STATISTICS_STORAGE_KEY)
  expect(stats).toMatchObject({ dailyGames: 1, totalAnswers: 7, correctAnswers: 7, bestDailyDepth: 7000 })
})

test('runs two infinite cycles without repeating within either cycle', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Infinito', exact: true }).click()
  await page.getByLabel('O que vamos explorar?').selectOption('natureza')
  await start(page)
  const poolSize = QUESTIONS.filter((item) => item.category === 'natureza').length
  for (let cycle = 0; cycle < 2; cycle++) {
    const seen = new Set<string>()
    for (let i = 0; i < poolSize; i++) {
      const prompt = await page.locator('.game-question').innerText()
      expect(seen.has(prompt)).toBe(false)
      seen.add(prompt)
      await page.getByRole('button', { name: 'Pular pergunta' }).click()
      if (cycle !== 1 || i !== poolSize - 1) await page.getByRole('button', { name: 'Continuar mergulhando' }).click()
    }
    expect(seen.size).toBe(poolSize)
  }
})

test('retains the absolute deadline across reload and automatically expires', async ({ page }) => {
  await page.goto('/')
  await start(page)
  const saved = async () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), `${DAILY_STORAGE_PREFIX}${DATE}`)
  const deadline = (await saved()).deadline
  await page.clock.fastForward(10_000)
  await page.reload()
  expect((await saved()).deadline).toBe(deadline)
  await expect(page.getByRole('timer')).toBeVisible()
  const remaining = await page.getByRole('timer').getAttribute('aria-label')
  expect(Number(remaining!.split(' ')[0])).toBeLessThanOrEqual(15)
  await page.clock.fastForward(16_000)
  await expect(page.getByRole('heading', { name: 'O relógio venceu.' })).toBeVisible()
  await expect(page.getByText('+0', { exact: false })).toBeVisible()
  const progress = await saved()
  expect(progress.results).toHaveLength(1)
  expect(progress.results[0]).toMatchObject({ correct: false, timedOut: true, points: 0 })
  expect(progress.deadline).toBeUndefined()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'O relógio venceu.' })).toBeVisible()
  expect((await saved()).results).toHaveLength(1)
})

test('awards zero for an invalid answer and supports a chosen infinite subject', async ({ page }) => {
  await page.goto('/')
  await start(page)
  await answer(page, 'uma resposta inexistente zzzz')
  await expect(page.getByRole('heading', { name: 'Não foi desta vez.' })).toBeVisible()
  await expect(page.getByText('+0', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Infinito', exact: true }).click()
  await page.getByLabel('O que vamos explorar?').selectOption('ciencia')
  await start(page)
  await expect(page.locator('.game-category')).toHaveText('Ciência')
  const prompt = await page.locator('.game-question').innerText()
  const question = QUESTIONS.find((item) => item.prompt === prompt)!
  expect(question.category).toBe('ciencia')
  await answer(page, question.answers[0].label)
  await expect(page.getByRole('button', { name: 'Continuar mergulhando' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar mergulhando' }).click()
  await expect(page.locator('.game-question')).not.toHaveText(prompt)
  await expect(page.locator('.game-category')).toHaveText('Ciência')
  await page.getByRole('button', { name: 'Pular pergunta' }).click()
  await page.getByRole('button', { name: 'Escolher outro assunto' }).click()
  await expect(page.getByLabel('O que vamos explorar?')).toBeVisible()
})

test('persists all six themes and closes dialogs with Escape while restoring focus', async ({ page }) => {
  await page.goto('/')
  for (const theme of THEMES) {
    const trigger = page.getByRole('button', { name: 'Aparência e preferências' })
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Do seu jeito' })).toBeVisible()
    await page.getByRole('button', { name: theme.label, exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id)
  }
  const help = page.getByRole('button', { name: 'Como jogar', exact: true })
  await help.click()
  await expect(page.getByRole('dialog', { name: 'Como jogar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fechar janela' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(help).toBeFocused()
})

test('fits a 390 px mobile screen during welcome, preferences and a round', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const assertNoOverflow = async () => {
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width)
  }
  await assertNoOverflow()
  await page.getByRole('button', { name: 'Aparência e preferências' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await assertNoOverflow()
  const modal = await page.getByRole('dialog').boundingBox()
  expect(modal!.x).toBeGreaterThanOrEqual(0)
  expect(modal!.x + modal!.width).toBeLessThanOrEqual(390)
  await page.keyboard.press('Escape')
  await start(page)
  await assertNoOverflow()
  await expect(page.getByLabel('Sua resposta mais rara')).toBeVisible()
})

test('keeps the session playable when local storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError') } })
  })
  await page.goto('/')
  await start(page)
  await expect(page.getByText('Seu navegador bloqueou o armazenamento.', { exact: false })).toBeVisible()
  await answer(page, getDailyQuestions(DATE)[0].answers[0].label)
  await expect(page.getByRole('button', { name: 'Próxima pergunta · 2/7' })).toBeVisible()
  await page.getByRole('button', { name: 'Próxima pergunta · 2/7' }).click()
  await expect(page.getByLabel('Sua resposta mais rara')).toBeVisible()
  await page.getByRole('button', { name: 'Aparência e preferências' }).click()
  await page.getByRole('button', { name: 'Lavanda', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lavanda')
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Suas preferências valem apenas nesta sessão.')
})
