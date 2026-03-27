import { notFound } from "next/navigation";
import HeroBannerEditForm from "@/app/marketplace/_components/HeroBannerEditForm";
import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/currentUser";
import { mapHeroBanner } from "@/lib/mappers/heroBanners";
import { heroBannerMediaInclude } from "@/lib/media-views";

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
    include: heroBannerMediaInclude,
  });

  if (!bannerRaw || bannerRaw.isDeleted) {
    notFound();
  }

  const banner = mapHeroBanner(bannerRaw);

  return (
    <div>
      <HeroBannerEditForm banner={banner} />
    </div>
  );
}
