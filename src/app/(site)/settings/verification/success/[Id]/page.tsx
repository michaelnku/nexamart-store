import { redirect } from "next/navigation";
import VerificationSuccessPage from "../../../_components/VerificationSuccessPage";
import { CurrentUser } from "@/lib/currentUser";

interface PageProps {
  params: {
    Id: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <VerificationSuccessPage verificationId={params.Id} />;
};

export default Page;
