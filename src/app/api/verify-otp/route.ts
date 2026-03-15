import { NextResponse } from "next/server";
import { OtpError, otpService } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    const verificationCheck = await otpService.verifyProviderManagedOtp({
      phone,
      code,
      channel: "sms",
      purpose: "phone_verification",
    });

    if (verificationCheck.approved) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error("[api/verify-otp] failed", {
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof OtpError ? error.message : "Failed to verify code.",
      },
      { status: 500 },
    );
  }
}
