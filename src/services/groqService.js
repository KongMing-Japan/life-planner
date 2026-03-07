/**
 * Groq AI Service with Model Fallback Strategy
 * Models: Qwen3-32B → Kimi K2 → Llama 4 Scout
 */

// Use local proxy to keep API Key secure on server side
// Set GROQ_API_KEY in Cloudflare Pages environment variables (Functions runtime).
const API_URL = '/api/chat';

const MODELS = [
    'qwen/qwen-2.5-32b',
    'moonshotai/kimi-k2-instruct-0905',
    'meta-llama/llama-4-scout-17b-16e-instruct'
];

// Context is handled by the caller (chatLogic.js)
let currentModelIndex = 0;

export async function sendMessage(messages) {
    const attempts = MODELS.length;

    for (let i = 0; i < attempts; i++) {
        const model = MODELS[(currentModelIndex + i) % MODELS.length];

        try {
            // Call local proxy instead of direct Groq API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization is handled by the server-side proxy
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages, // Pass messages directly
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Model ${model} failed:`, errorData);

                // Check if rate limited or model unavailable
                if (response.status === 429 || response.status === 503) {
                    currentModelIndex = (currentModelIndex + i + 1) % MODELS.length;
                    continue; // Try next model
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return {
                content: data.choices[0].message.content,
                model: model,
            };
        } catch (error) {
            console.error(`Error with model ${model}:`, error);
            if (i === attempts - 1) {
                throw error; // All models failed
            }
        }
    }

    throw new Error('All models failed');
}

export function getCurrentModel() {
    return MODELS[currentModelIndex];
}

export function resetModelIndex() {
    currentModelIndex = 0;
}
