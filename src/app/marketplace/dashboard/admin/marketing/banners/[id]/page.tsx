import { notFound } from "next/navigation";
import HeroBannerEditForm from "@/app/marketplace/_components/HeroBannerEditForm";
import { prisma } from "@/lib/prisma";
import { HeroBannerWithFiles } from "@/lib/types";
import { CurrentUser } from "@/lib/currentUser";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const user = await CurrentUser();
  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const bannerRaw = await prisma.heroBanner.findUnique({
    where: { id },
  });

  if (!bannerRaw || bannerRaw.isDeleted) {
    notFound();
  }

  const banner: HeroBannerWithFiles = {
    ...bannerRaw,
    backgroundImage:
      bannerRaw.backgroundImage as HeroBannerWithFiles["backgroundImage"],
    productImage: bannerRaw.productImage as HeroBannerWithFiles["productImage"],
  };

  return (
    <div className="p-6">
      <HeroBannerEditForm banner={banner} />
    </div>
  );
}
