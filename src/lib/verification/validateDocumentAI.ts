import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function extractJSON(text: string) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function validateDocumentAI(imageUrl: string) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
Analyze this uploaded document image.

Return JSON in this format:

{
 "valid": true | false,
 "detectedType": "PASSPORT | DRIVER_LICENSE | NATIONAL_ID | BUSINESS_LICENSE | VEHICLE_REGISTRATION | UNKNOWN",
 "reason": "why invalid"
}

Reject if:
- blurry
- cropped
- unreadable
- not an ID document
`,
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "auto",
          },
        ],
      },
    ],
  });

  const text = response.output_text;

  const parsed = extractJSON(text);

  if (!parsed) {
    console.error("AI parse error:", text);

    return {
      valid: false,
      detectedType: "UNKNOWN",
      reason: "AI validation failed",
    };
  }

  return parsed;
}
