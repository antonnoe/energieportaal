import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, prompt } = req.body;

  if (!system || !prompt) {
    return res.status(400).json({ error: 'Missing system or prompt' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 600,
        system: system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const text = data.content
      ?.filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n') || '';

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: 'AI advisor unavailable' });
  }
}
