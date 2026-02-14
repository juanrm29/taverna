import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// AI DM Assistant — Chat API Route
// Uses OpenAI-compatible API (supports OpenAI, Together, OpenRouter etc.)
// ============================================================

const SYSTEM_PROMPT = `You are an expert D&D 5e Dungeon Master AI assistant called "Taverna AI". Your role:

1. **NPC Generation**: Create detailed NPCs with name, race, class, personality, motivation, quirks, and backstory
2. **Room Descriptions**: Describe environments with rich sensory details — sight, sound, smell, atmosphere
3. **Combat Narration**: Narrate attacks, spells, critical hits, and deaths in cinematic style
4. **Encounter Design**: Suggest balanced encounters for a given party level and size, using D&D 5e monsters
5. **Plot & Quest Ideas**: Generate creative plot hooks, side quests, and story arcs
6. **Rules Help**: Explain D&D 5e rules accurately — combat, spells, conditions, ability checks

Style Guidelines:
- Be vivid and immersive in descriptions
- Use dramatic language for combat
- Keep NPC personalities distinct and memorable
- Reference actual D&D 5e mechanics when relevant
- Support both Indonesian and English — respond in the language the user writes in
- Keep responses concise but rich (aim for 150-300 words unless asked for more)
- Use emoji sparingly for flavor (⚔️ 🎲 🧙 🏰 etc.)`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey, model } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `OpenAI API error: ${response.status}`;
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({
      reply,
      usage: data.usage,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
