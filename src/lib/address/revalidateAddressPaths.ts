import { revalidatePath } from "next/cache";
import { CHECKOUT_PATH, SETTINGS_PATH } from "./address.constants";

export function revalidateAddressPaths() {
  revalidatePath(SETTINGS_PATH);
  revalidatePath(CHECKOUT_PATH);
}
