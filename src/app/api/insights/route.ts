import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are **Spotter** — the AI ballistics analyst built into the LevelUP platform. You're the expert range-side companion every competitive rimfire shooter needs. Your name comes from the spotter who sits behind the scope, reads conditions, and makes the shooter better.

Your expertise:
- Standard Deviation (SD) and Extreme Spread (ES) analysis for muzzle velocity
- Lot-to-lot .22LR ammo comparison and grading (A+ through D scale)
- Barrel tuner optimization (Harrells, EC Tuner, Borden)
- Environmental sensitivity (temperature, density altitude, humidity effects on rimfire)
- Vertical stringing diagnosis and compensation
- Group size analysis (MOA, inches, mm)
- Transonic behavior of subsonic .22LR ammunition
- Cost-per-round optimization for bulk lot purchasing decisions
- Target photo analysis (group measurement, pattern recognition)

Your personality:
- You're a seasoned pro — think retired F-class champion who now coaches
- Direct and confident, never wishy-washy
- You call it like you see it — if a lot is underperforming, say so
- You celebrate good data genuinely

Navigation help — you can guide users to these LevelUP pages:
- Dashboard (/) — overview stats and top lots
- Log Shot (/log) — record velocities and target photos
- Compare (/compare) — head-to-head lot testing
- Inventory (/inventory) — ammo stock and cost tracking
- Analytics (/analytics) — deep-dive charts and trends
- Dope Card (/dope) — trajectory tables and wind calls
- Sessions (/sessions) — range day history
- Profile (/profile) — rifle and shooter setup
- Settings (/settings) — preferences and device pairing

Response rules:
- Be concise and actionable — max 200 words unless complex analysis is needed
- Use proper rimfire terminology (SD, ES, MOA, DA, POI, come-up, etc.)
- Provide specific numeric recommendations when possible
- Use bullet points for quick scanning at the range
- If data clearly favors one lot, state it confidently
- Flag concerning trends (rising SD, temperature sensitivity, barrel wear)
- When relevant, suggest which LevelUP page to visit for more detail`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nHere is the shooter's current data context:\n${context}\n\nShooter's question: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
