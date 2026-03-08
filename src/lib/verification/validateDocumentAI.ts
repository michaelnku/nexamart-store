import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

Return JSON ONLY:

{
 "valid": true | false,
 "detectedType": "PASSPORT | DRIVER_LICENSE | NATIONAL_ID | BUSINESS_LICENSE | VEHICLE_REGISTRATION | UNKNOWN",
 "reason": "explanation if invalid"
}

Reject if:
- blurry
- cropped
- unreadable
- no document
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

  try {
    return JSON.parse(response.output_text);
  } catch {
    return {
      valid: false,
      detectedType: "UNKNOWN",
      reason: "AI validation failed",
    };
  }
}
