import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('single-page planner interactions', () => {
  beforeEach(() => localStorage.clear())

  it('adds family members and life events without leaving the dashboard', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('生涯資産シミュレーション')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '子どもを追加' }))
    expect(screen.getByText('子ども3 · 0歳')).toBeInTheDocument()
    await user.click(screen.getByText('ライフイベント'))
    const addEvent = screen.getByRole('button', { name: 'イベントを追加' })
    await user.click(addEvent)
    expect(screen.getByDisplayValue('新しいイベント')).toBeInTheDocument()
  })

  it('opens the chat assistant and applies a quick template', async () => {
    const user = userEvent.setup()
    render(<App />)
    const fab = screen.getByTitle('AI Assistant')
    await user.click(fab)
    expect(screen.getByText('AIアシスタント')).toBeInTheDocument()
    await user.click(screen.getByText('単身・堅実型'))
    expect(screen.getByText('「単身・堅実型」のテンプレートを適用しました。データが更新されました。')).toBeInTheDocument()
  })

  it('starts with the simplified inputs and shows cash flow before assets', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('まず6つの数字を入力')).toBeInTheDocument()
    expect(screen.queryByText('REAL YEN · 現在価値')).not.toBeInTheDocument()
    expect(screen.getByText('必要な運用利回り')).toBeInTheDocument()
    expect(screen.getByText('退職後の年間調整額')).toBeInTheDocument()
    expect(screen.getByLabelText('年間収入・支出')).toBeInTheDocument()
    const cashflow = screen.getByText('年間収入・支出')
    const assets = screen.getByText('家族資産の推移')
    expect(cashflow.compareDocumentPosition(assets) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText('万円').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: '詳細' }))
    expect(screen.getByRole('spinbutton', { name: /本人の年齢/ })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: '借入金利（名目）%' })).toBeInTheDocument()
  })

  it('switches the complete interface from Japanese to Chinese', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '中' }))
    expect(screen.getByText('人生财富规划器')).toBeInTheDocument()
    expect(screen.getByText('先填6个关键数字')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})
