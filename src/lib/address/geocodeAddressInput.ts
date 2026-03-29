import { geocodeAddress } from "@/lib/shipping/mapboxGeocode";
import type {
  AddressActionInput,
  GeocodedAddressCoordinates,
} from "./address.types";

export async function geocodeAddressInput(
  values: AddressActionInput,
): Promise<GeocodedAddressCoordinates> {
  return geocodeAddress({
    street: values.street,
    city: values.city,
    state: values.state ?? undefined,
    country: values.country ?? "",
  });
}
