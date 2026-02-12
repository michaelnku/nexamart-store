import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return NextResponse.json({ success: true, status: verification.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error });
  }
}
