import { MARKET_PLACE_LOGIN_REDIRECT } from "@/routes";
import { redirect } from "next/navigation";

const page = () => {
  redirect(MARKET_PLACE_LOGIN_REDIRECT);
};

export default page;
