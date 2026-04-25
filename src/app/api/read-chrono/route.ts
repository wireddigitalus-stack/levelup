import { NextRequest, NextResponse } from "next/server";

const CHRONO_PROMPT = `You are an expert at reading digital chronograph screens used for firearms ballistic testing.
Analyze this photo of a chronograph display (Garmin Xero C1, MagnetoSpeed, LabRadar, Caldwell, or similar device).

Extract ALL velocity readings and statistics visible on the screen into structured JSON.

The screen may show one of these views:
1. **Single Shot** — just one FPS reading
2. **String Summary** — Average, SD, ES, High, Low, and shot count
3. **Shot List** — Individual round-by-round FPS values

Return ONLY valid JSON in this exact format (use null for any value not visible):
{
  "device": "string — detected device name (Garmin Xero C1, MagnetoSpeed, LabRadar, etc.) or 'Unknown'",
  "view": "single_shot | string_summary | shot_list | unknown",
  "summary": {
    "avgFps": "number or null",
    "sdFps": "number or null",
    "esFps": "number or null",
    "highFps": "number or null",
    "lowFps": "number or null",
    "shotCount": "number or null"
  },
  "shots": [
    { "round": 1, "fps": 1050 }
  ],
  "confidence": "high | medium | low",
  "warnings": ["list of anything unclear or potentially misread"]
}

Important rules:
- Chronograph FPS values for .22 LR rimfire are typically 900–1200 fps
- SD (standard deviation) is typically 3–20 fps for rimfire
- ES (extreme spread) is typically 8–60 fps for rimfire
- If you see a single large number (e.g. "1058"), that is likely the velocity in FPS
- Read digits very carefully: 0 vs O, 1 vs 7, 3 vs 8, 5 vs 6
- Screen glare may obscure some digits — flag these in warnings
- If the image is NOT a chronograph screen, set confidence to "low" and add a warning
- Return ONLY the JSON object, no markdown or explanation`;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const matches = image.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid image format. Expected base64 data URL." },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Try primary model, fallback to flash
    const models = ["gemini-2.5-flash", "gemini-2.5-pro"];
    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: CHRONO_PROMPT },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (!response.ok) {
          lastError = `${model}: HTTP ${response.status}`;
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const cleanedText = rawText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        try {
          const parsed = JSON.parse(cleanedText);
          return NextResponse.json({ data: parsed, raw: rawText });
        } catch {
          return NextResponse.json({
            error: "Failed to parse chrono data. The screen may be too blurry or obscured.",
            raw: rawText,
          });
        }
      } catch {
        lastError = `${model}: network error`;
        continue;
      }
    }

    return NextResponse.json(
      { error: `All models failed. Last error: ${lastError}` },
      { status: 500 }
    );
  } catch (error) {
    console.error("Read Chrono API error:", error);
    return NextResponse.json(
      { error: "Failed to process chronograph photo" },
      { status: 500 }
    );
  }
}
