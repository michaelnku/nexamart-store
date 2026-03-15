import { NextResponse } from "next/server";
import { OtpError, otpService } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    const verification = await otpService.sendProviderManagedOtp({
      phone,
      channel: "sms",
      purpose: "phone_verification",
    });

    return NextResponse.json({ success: true, status: verification.status });
  } catch (error) {
    console.error("[api/send-otp] failed", {
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof OtpError
            ? error.message
            : "Failed to send verification code.",
      },
      { status: 500 },
    );
  }
}
