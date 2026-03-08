import crypto from "crypto";

export function createImageFingerprint(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
