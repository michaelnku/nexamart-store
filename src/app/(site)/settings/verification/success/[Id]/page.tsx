import { redirect } from "next/navigation";
import VerificationSuccessPage from "../../../_components/VerificationSuccessPage";
import { CurrentUser } from "@/lib/currentUser";

const Page = async ({ params }: { params: Promise<{ Id: string }> }) => {
  const { Id } = await params;
  const user = await CurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <VerificationSuccessPage verificationId={Id} />;
};

export default Page;
