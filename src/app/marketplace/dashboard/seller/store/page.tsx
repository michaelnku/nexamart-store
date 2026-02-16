import { CurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await CurrentUser();
  if (!user) redirect("/auth/login");

  const store = await prisma.store.findUnique({
    where: { userId: user.id },
  });

  if (!store) redirect("/marketplace/dashboard/seller/store/create-store");

  redirect(`/store/${store.slug}`);
};

export default Page;
