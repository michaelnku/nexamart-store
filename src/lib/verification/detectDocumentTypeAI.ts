import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function detectDocumentTypeAI(imageUrl: string) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
Look at this identity document image and determine the document type.

Return JSON ONLY:

{
 "type": "PASSPORT | DRIVER_LICENSE | NATIONAL_ID | BUSINESS_LICENSE | VEHICLE_REGISTRATION | UNKNOWN"
}
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
    return { type: "UNKNOWN" };
  }
}
