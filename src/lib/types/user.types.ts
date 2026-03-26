import {
  EmploymentType,
  RiderProfile,
  StaffProfile,
  StaffStatus,
  Store,
  UserRole,
  VerificationStatus,
} from "@/generated/prisma/client";
import type { ProfileImage } from "./shared.types";

export type UserDTO = {
  id: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  isEmailVerified: boolean;
  hasPassword?: boolean;

  profileAvatar?: ProfileImage | null;

  name: string;
  username: string;
  image?: string | null;
  isBanned: boolean;

  isVerified: boolean;

  store?: Store | null;
  riderProfile?: RiderProfile | null;
  staffProfile?: StaffProfile | null;
};

export type AppUser = UserDTO | null;

export type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

export type RiderProfileDTO = Pick<
  RiderProfile,
  | "vehicleType"
  | "plateNumber"
  | "licenseNumber"
  | "vehicleColor"
  | "vehicleModel"
  | "isVerified"
  | "isAvailable"
>;

export type StaffProfileDTO = {
  id: string;
  userId: string;
  staffId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  stripeAccountId?: string | null;
  isVerified: boolean;
  verifiedAt?: Date | null;
  verificationMethod?: string | null;
  verificationStatus: VerificationStatus;
  department?: string | null;
  employmentType?: EmploymentType | null;
  status: StaffStatus;
  joinedAt: Date;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
