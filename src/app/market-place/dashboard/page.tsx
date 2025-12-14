import { CurrentUser } from "@/lib/currentUser";
import { RoleBasedPageContent } from "../_components/RoleBasedPageContent";

const page = async () => {
  const user = await CurrentUser();
  return (
    <div>
      <RoleBasedPageContent initialUser={user ?? null} />
    </div>
  );
};

export default page;
