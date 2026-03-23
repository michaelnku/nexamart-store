import CreateStoreForm from "@/app/marketplace/_components/CreateStoreForm";
import { CurrentUser } from "@/lib/currentUser";
import { EmailVerificationGate } from "@/components/email-verification/EmailVerificationGate";

const page = async () => {
  const user = await CurrentUser();

  return (
    <div>
      {user?.isEmailVerified ? (
        <CreateStoreForm />
      ) : (
        <div className="mx-auto max-w-4xl px-4 py-6">
          <EmailVerificationGate
            email={user?.email ?? null}
            description="Store creation is available only after you verify the email address on your NexaMart account."
          />
        </div>
      )}
    </div>
  );
};

export default page;
