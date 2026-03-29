import type { addressSchemaType } from "@/lib/zodValidation";
import type { Prisma } from "@/generated/prisma";

export type AddressActionInput = addressSchemaType;

export type NormalizedAddressInput = {
  label: AddressActionInput["label"];
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string | undefined;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

export type GeocodedAddressCoordinates = {
  latitude: number;
  longitude: number;
};

export type PersistedAddress = Prisma.AddressGetPayload<Record<string, never>>;

export type AddressActionSuccess = {
  success: true;
  address: PersistedAddress;
  error?: undefined;
};

export type AddressActionFailure = {
  error: string;
  success?: undefined;
  address?: undefined;
};

export type AddressMutationResult = AddressActionSuccess | AddressActionFailure;

export type AddressSimpleSuccess = {
  success: true;
  error?: undefined;
};

export type AddressSimpleResult = AddressSimpleSuccess | AddressActionFailure;

export type UserAddressesSuccess = {
  success: true;
  addresses: Array<{
    id: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string | null;
    country: string | null;
    isDefault: boolean;
  }>;
  error?: undefined;
};

export type UserAddressesFailure = {
  error: string;
  addresses: readonly [];
  success?: undefined;
};

export type UserAddressesResult = UserAddressesSuccess | UserAddressesFailure;
