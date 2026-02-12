import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: phone,
        code: code,
      });

    if (verificationCheck.status === "approved") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error });
  }
}
