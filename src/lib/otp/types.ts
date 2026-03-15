export type OtpChannel = "sms" | "whatsapp";

export type OtpPurpose =
  | "delivery"
  | "signup"
  | "phone_verification"
  | "password_reset"
  | "two_factor_auth";

export type OtpStrategy = "local_db" | "provider_managed";

export type OtpProviderName = "twilio" | "vonage" | "plivo";

export type OtpProviderFeature = "messaging" | "managed_verification";

export interface OtpSendResult {
  provider: OtpProviderName;
}

export interface OtpTransportRequest {
  phone: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  message: string;
  userId?: string;
}

export interface OtpTransportSendRequest extends OtpTransportRequest {
  strategy?: OtpStrategy;
}

export interface SendManagedOtpRequest {
  phone: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  userId?: string;
}

export interface VerifyManagedOtpRequest {
  phone: string;
  code: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  userId?: string;
}

export interface OtpProvider {
  readonly name: OtpProviderName;
  supportsChannel(channel: OtpChannel, feature: OtpProviderFeature): boolean;
  sendMessage(input: OtpTransportRequest): Promise<OtpSendResult>;
  sendVerification(input: SendManagedOtpRequest): Promise<{ status: string }>;
  verifyCode(input: VerifyManagedOtpRequest): Promise<{ approved: boolean; status: string }>;
}
