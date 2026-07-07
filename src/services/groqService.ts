/**
 * Groq AI Service with Model Fallback Strategy
 * Models: Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B
 */

const API_URL = '/api/chat'

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]

let currentModelIndex = 0

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  content: string
  model: string
}

export async function sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  const attempts = MODELS.length

  for (let i = 0; i < attempts; i++) {
    const model = MODELS[(currentModelIndex + i) % MODELS.length]

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.2, // lower temperature for JSON extraction consistency
          max_tokens: 1500,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn(`Model ${model} failed:`, errorData)

        if (response.status === 429 || response.status === 503) {
          currentModelIndex = (currentModelIndex + i + 1) % MODELS.length
          continue
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        model: model,
      }
    } catch (error) {
      console.error(`Error with model ${model}:`, error)
      if (i === attempts - 1) {
        throw error
      }
    }
  }

  throw new Error('All models failed')
}

export function getCurrentModel() {
  return MODELS[currentModelIndex]
}
