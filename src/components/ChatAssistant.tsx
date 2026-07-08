import { MessageSquare, Send, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type ChatMessage, sendMessage } from '../services/groqService'
import type { I18nCopy, Locale } from '../i18n'
import { templates } from '../data/defaultPlan'
import type { PlannerV2 } from '../types'

type Props = {
  plan: PlannerV2
  locale: Locale
  copy: I18nCopy
  onChange: (plan: PlannerV2) => void
}

interface ChatHistoryItem {
  id: string
  role: 'user' | 'assistant' | 'system-status'
  text: string
}

export function ChatAssistant({ plan, locale, copy, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<ChatHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getTemplateDisplayName = (id: string, defaultName: string) => {
    if (locale === 'zh') {
      if (id === 'standard') return '普通工薪家庭'
      if (id === 'family') return '双职工家庭'
      if (id === 'single') return '单身稳健家庭'
      if (id === 'homemaker') return '家庭主妇家庭'
    }
    return defaultName
  }

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const nextPlan = template.build()
    onChange(nextPlan)

    const userText =
      locale === 'zh'
        ? `加载模板：${getTemplateDisplayName(template.id, template.name)}`
        : `テンプレートを適用：${template.name}`

    const assistantText =
      locale === 'zh'
        ? `已为您加载「${getTemplateDisplayName(template.id, template.name)}」的规划模板，数据已在主界面中更新。`
        : `「${template.name}」のテンプレートを適用しました。データが更新されました。`

    setHistory((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user' as const, text: userText },
      { id: `ai-${Date.now()}`, role: 'assistant' as const, text: assistantText },
    ])
  }

  // Initialize greeting on mount or locale change
  useEffect(() => {
    const greetingText =
      locale === 'zh'
        ? '您好！我是您的 AI 财务助手。您可以直接输入您的基本情况（例如：“我35岁，年收600万，打算65岁退休”）或让我调整参数（例如：“把通胀率改为 2%”、“添加每年100万的教育费，持续10年”）。'
        : 'こんにちは！AIアシスタントです。あなたの状況（例：「私は35歳、年収600万、65歳退職予定」）を教えていただくか、「物価上昇率を2%に変更」「教育費として毎年100万円を10年間追加」などの調整を指示してください。'

    setHistory([
      {
        id: 'welcome',
        role: 'assistant',
        text: greetingText,
      },
    ])
  }, [locale])

  // Scroll to bottom when history updates
  useEffect(() => {
    if (open && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history, open])

  const handleClearHistory = () => {
    const greetingText =
      locale === 'zh'
        ? '已清空对话记录。请告诉我您想做哪些调整。'
        : '対話履歴をクリアしました。どのような調整を行いますか？'

    setHistory([
      {
        id: `clear-${Date.now()}`,
        role: 'assistant',
        text: greetingText,
      },
    ])
  }

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return

    const userMsgId = `user-${Date.now()}`
    const nextHistory = [
      ...history,
      { id: userMsgId, role: 'user' as const, text: messageText },
    ]
    setHistory(nextHistory)
    setInput('')
    setLoading(true)

    // Build the system prompt detailing our v2 state structure
    const systemPrompt = `You are a professional AI Financial Planner.
The user is modeling their life plan (current year is ${plan.assumptions.startYear}).
Your objective is to:
1. Parse the user's message.
2. Formulate a short, friendly response in their language (locale: ${locale}).
3. Return the specific modifications that should be applied to their plan parameters in JSON format.

You MUST reply with a single JSON object strictly matching this format (no other wrapper text outside the JSON code block):
\`\`\`json
{
  "reply": "Friendly response string confirming what was changed...",
  "updates": {
    "assumptions": { // optional
      "initialAssets": number,
      "nominalReturn": number, // nominal return rate (e.g. 0.05 for 5%)
      "inflation": number, // inflation rate (e.g. 0.02 for 2%)
      "borrowingRate": number, // borrowing nominal rate (e.g. 0.04 for 4%)
      "endAge": number // plan end age (e.g. 100)
    },
    "adults": [ // optional, if modifying people. Must match the array length or update specific fields
      {
        "id": "primary", // or "spouse"
        "name": "string",
        "currentAge": number,
        "annualSalary": number,
        "annualSalaryGrowth": number, // real growth rate (e.g. 0.01 for 1%)
        "retireAge": number,
        "pensionStartAge": number,
        "annualPension": number,
        "medicalStartAge": number,
        "annualMedicalExpense": number
      }
    ],
    "children": [ // optional, list of children
      {
        "id": "child-xxx", // or unique ID
        "name": "string",
        "currentAge": number
      }
    ],
    "expenses": { // optional, annual household expenses
      "housingBeforeRetirement": number,
      "housingAfterRetirement": number,
      "livingBeforeRetirement": number,
      "livingAfterRetirement": number,
      "annualTravel": number
    },
    "events": [ // optional, list of life events. Note: Tuition and mortgage should have a duration (e.g. 3 years, 4 years, 30 years)!
      {
        "id": "string", // Unique ID (e.g., 'event-tuition', 'event-xxx')
        "name": "string", // Event name (e.g., "大学学费", "中学学费")
        "memberId": "string" | null, // link to child or adult ID if applicable
        "type": "income" | "expense",
        "startYear": number,
        "duration": number, // MUST specify the duration of years (e.g. 3 for high school, 4 for college, 30 for mortgage)
        "annualAmount": number,
        "taxable": boolean
      }
    ]
  }
}
\`\`\`

Here is the user's current planner plan state for reference:
${JSON.stringify(plan, null, 2)}

IMPORTANT: ONLY return keys in the "updates" object that are actually changing based on the user's instructions. If a field (such as "events", "children", "adults", or "expenses") is NOT being modified, do NOT include it in the "updates" object. For example, if you are only changing the interest rate, only output:
{
  "reply": "...",
  "updates": {
    "assumptions": { "nominalReturn": 0.05 }
  }
}
Do NOT output empty arrays or objects (like "events": [] or "children": []) unless the user explicitly requested to delete them, as this will overwrite and delete the user's existing data!

Strictly output valid JSON matching the format. Be precise about numbers, currency, and percentages (e.g. 2% = 0.02). Use ¥10,000 unit values correctly (e.g. 600万 = 6,000,000).`

    try {
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...nextHistory
          .filter((item) => item.role !== 'system-status')
          .slice(-6) // include up to last 6 messages
          .map((item) => ({
            role: item.role as 'user' | 'assistant',
            content: item.text,
          })),
      ]

      const response = await sendMessage(chatMessages)
      const content = response.content.trim()

      // Parse JSON from code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : content
      const parsed = JSON.parse(jsonStr)

      const replyText = parsed.reply || 'Updated successfully.'

      // Apply updates to the plan
      if (parsed.updates) {
        const nextPlan = { ...plan }

        if (parsed.updates.assumptions) {
          nextPlan.assumptions = { ...nextPlan.assumptions, ...parsed.updates.assumptions }
        }
        if (parsed.updates.expenses) {
          nextPlan.expenses = { ...nextPlan.expenses, ...parsed.updates.expenses }
        }
        if (parsed.updates.adults) {
          // Merge adults by ID
          nextPlan.adults = nextPlan.adults.map((adult) => {
            const patch = parsed.updates.adults.find((a: any) => a.id === adult.id)
            return patch ? { ...adult, ...patch } : adult
          })
          // If spouse added in payload but not in current list
          const spousePatch = parsed.updates.adults.find((a: any) => a.id === 'spouse')
          if (spousePatch && !nextPlan.adults.some((a) => a.id === 'spouse')) {
            nextPlan.adults.push({
              id: 'spouse',
              role: 'spouse',
              name: spousePatch.name || '配偶者',
              currentAge: spousePatch.currentAge || 30,
              annualSalary: spousePatch.annualSalary || 0,
              annualSalaryGrowth: spousePatch.annualSalaryGrowth || 0,
              retireAge: spousePatch.retireAge || 65,
              pensionStartAge: spousePatch.pensionStartAge || 65,
              annualPension: spousePatch.annualPension || 0,
              medicalStartAge: spousePatch.medicalStartAge || 70,
              annualMedicalExpense: spousePatch.annualMedicalExpense || 0,
            })
          }
        }
        if (parsed.updates.children) {
          const hasChildrenDeletion = /delete|remove|clear|删除|清除|清空|子どもを削除|削/i.test(messageText)
          if (parsed.updates.children.length > 0 || hasChildrenDeletion) {
            nextPlan.children = parsed.updates.children
          }
        }
        if (parsed.updates.events) {
          const hasEventsDeletion = /delete|remove|clear|删除|清零|清除|清空|削|イベントを削除|クリア/i.test(messageText)
          if (parsed.updates.events.length > 0 || hasEventsDeletion) {
            nextPlan.events = parsed.updates.events
          }
        }

        onChange(nextPlan)
      }

      setHistory((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', text: replyText },
      ])
    } catch (error) {
      console.error('AI error:', error)
      const errorText =
        locale === 'zh'
          ? '当前AI服务繁忙，请稍后重新发送。'
          : locale === 'ja'
            ? '現在AIサービスが混雑しています。しばらく経ってから再度送信してください。'
            : 'The AI service is currently busy. Please try again later.'
      setHistory((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', text: errorText },
      ])
    } finally {
      setLoading(false)
    }
  }

  const chips =
    locale === 'zh'
      ? [
          '我今年35岁年薪600万，配偶32岁年薪400万',
          '把投资年化名义收益率改成 4.5%',
          '从2032年开始，连续4年每年新增200万大学学费支出',
          '设置计划至95岁，通胀率1.8%',
        ]
      : [
          '私は35歳年収600万、配偶者は32歳年収400万',
          '運用利回りを4.5%に変更',
          '2032年から4年間、毎年200万円の大学学费を追加',
          '95歳まで試算、インフレ率1.8%',
        ]

  return (
    <>
      <button
        className="ai-assistant-fab"
        type="button"
        title="AI Assistant"
        onClick={() => setOpen(!open)}
      >
        <MessageSquare />
        <span className="ai-badge" />
      </button>

      <div className={`ai-assistant-panel ${open ? 'open' : ''}`}>
        <div className="ai-panel-header">
          <h3>
            <MessageSquare />
            {locale === 'zh' ? 'AI 财务助手' : 'AIアシスタント'}
          </h3>
          <div className="ai-panel-header-actions">
            <button
              type="button"
              title={locale === 'zh' ? '清空历史' : locale === 'ja' ? '履歴クリア' : 'Clear Chat'}
              onClick={handleClearHistory}
            >
              <Trash2 />
            </button>
            <button
              type="button"
              title="Close"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </div>
        </div>

        <div className="ai-chat-messages">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`ai-message ${msg.role}`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <span className="ai-loading-dots">...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chips-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.65rem 1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.38rem' }}>
            <span style={{ fontSize: '0.52rem', color: 'var(--muted)', width: '100%', fontWeight: 700, marginBottom: '0.1rem' }}>
              {locale === 'zh' ? '⚡ 快速模板 (不消耗AI额度)' : locale === 'ja' ? '⚡ クイックテンプレート (AI不要)' : '⚡ Quick Templates (No AI needed)'}
            </span>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="ai-chip"
                style={{ borderColor: 'var(--blue-600)', background: 'var(--blue-50)', color: 'var(--blue-700)', fontWeight: 650 }}
                onClick={() => handleApplyTemplate(t.id)}
              >
                {getTemplateDisplayName(t.id, t.name)}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.38rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.52rem', color: 'var(--muted)', width: '100%', fontWeight: 700, marginBottom: '0.1rem' }}>
              {locale === 'zh' ? '🤖 AI 提问示例' : locale === 'ja' ? '🤖 AI質問の例' : '🤖 AI Prompts'}
            </span>
            {chips.map((chip, i) => (
              <button
                key={i}
                type="button"
                className="ai-chip"
                onClick={() => handleSend(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <form
          className="ai-chat-input-area"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
        >
          <input
            type="text"
            value={input}
            disabled={loading}
            placeholder={
              locale === 'zh'
                ? '修改参数，如：“将通胀率设为2%”'
                : locale === 'ja'
                  ? '「インフレ率を2%に」などと入力...'
                  : 'Type instructions...'
            }
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
          >
            <Send />
          </button>
        </form>
      </div>
    </>
  )
}
