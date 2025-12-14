import { useCurrentUserQuery } from "@/stores/useGetCurrentUserQuery";
import { RoleBasedSettingsPage } from "../../../_components/RoleBasedPageContent";

const page = () => {
  const { data: user } = useCurrentUserQuery();
  return (
    <div>
      <RoleBasedSettingsPage initialUser={user ?? null} />
    </div>
  );
};

export default page;
