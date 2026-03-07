/**
 * Cloudflare Pages Function
 * Proxies requests to Groq API to hide the API Key
 */
export async function onRequestPost({ request, env }) {
    try {
        // Server-side secret only. Keep legacy fallback for existing deployments.
        const apiKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the body from the frontend request
        const body = await request.json();

        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Handle Groq errors
        if (!response.ok) {
            const errorText = await response.text();
            return new Response(errorText, {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Return successful response
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
