import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET() {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );

    await client.messages.create({
      body: "NexaMart SMS test 🚀",
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: "+2349025684633",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error });
  }
}
