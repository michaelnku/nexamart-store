"use client";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";

const NotFoundError: React.FC = () => {
  const router = useRouter();
  const user = useCurrentUser();

  const goHome = () => {
    if (user?.role === "MODERATOR")
      router.push("/marketplace/dashboard/moderator");
    else if (user?.role === "ADMIN")
      router.push("/marketplace/dashboard/admin");
    else if (user?.role === "SELLER")
      router.push("/marketplace/dashboard/seller");
    else if (user?.role === "RIDER")
      router.push("/marketplace/dashboard/rider");
    else router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <Button
        onClick={goHome}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go Home
      </Button>
    </div>
  );
};

export default NotFoundError;
