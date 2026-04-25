import { NextRequest, NextResponse } from "next/server";

const EXTRACTION_PROMPT = `You are an expert OCR system for rimfire ballistic testing data sheets. 
Analyze this handwritten data sheet photo and extract ALL fields into structured JSON.

The sheet follows this standard format:
- Header: Rifle, Date, Temperature, Wind Direction, Condition, Wind Speed
- Ammo: Ammo Make, Type, Lot Number, Nickname
- Data Grid (up to 5 rounds): Distance, Tuner Setting, Velocity (Avg), SD, ES, Group Size, V Spread, H Spread, Elevation
- Notes: Per-round notes

Return ONLY valid JSON in this exact format (use null for empty/unreadable fields):
{
  "header": {
    "rifle": "string or null",
    "date": "string or null",
    "temperature": "number or null",
    "windDirection": "string or null",
    "condition": "string or null",
    "windSpeed": "number or null"
  },
  "ammo": {
    "make": "string or null",
    "type": "string or null",
    "lotNumber": "string or null",
    "nickname": "string or null"
  },
  "rounds": [
    {
      "round": 1,
      "distance": "number or null",
      "tunerSetting": "number or null",
      "velocityAvg": "number or null",
      "sd": "number or null",
      "es": "number or null",
      "groupSize": "number or null",
      "vSpread": "number or null",
      "hSpread": "number or null",
      "elevation": "number or null",
      "notes": "string or null"
    }
  ],
  "confidence": "high | medium | low",
  "warnings": ["list of any fields that were hard to read"]
}

Important rules:
- Read handwriting carefully — common misreads: 0 vs O, 1 vs l, 5 vs S
- Velocity values are typically 900-1200 for .22LR
- SD is typically 3-20 fps
- ES is typically 10-60 fps
- Group sizes are typically 0.2-3.0 (MOA or inches)
- Temperature in Fahrenheit, typically 30-100
- If a field is clearly empty (no writing), use null
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

    // Extract base64 data and mime type from data URL
    const matches = image.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid image format. Expected base64 data URL." },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

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
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: EXTRACTION_PROMPT,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Low temp for accurate extraction
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini Vision API error:", errorData);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON from Gemini's response
    // Strip any markdown code fences if present
    const cleanedText = rawText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanedText);
      return NextResponse.json({ data: parsed, raw: rawText });
    } catch {
      // If JSON parsing fails, return the raw text for debugging
      return NextResponse.json({
        error: "Failed to parse extracted data. The handwriting may be too difficult to read.",
        raw: rawText,
      });
    }
  } catch (error) {
    console.error("Scan Sheet API error:", error);
    return NextResponse.json(
      { error: "Failed to process data sheet scan" },
      { status: 500 }
    );
  }
}
