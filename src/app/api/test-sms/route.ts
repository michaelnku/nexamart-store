import { NextResponse } from "next/server";
import { OtpError, otpService } from "@/lib/otp";

export async function GET() {
  try {
    await otpService.sendLocalDeliveryOtpMessage(
      "+2349025684633",
      "NexaMart SMS test",
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/test-sms] failed", {
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof OtpError ? error.message : "SMS test failed.",
      },
      { status: 500 },
    );
  }
}
