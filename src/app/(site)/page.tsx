import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import { Suspense } from "react";
import HomeContent from "./HomeContent";
import { CurrentUser } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import {
  getDashboardRedirectForRole,
  isStaffRole,
} from "@/lib/auth/roleRedirect";
import { getResolvedSeoSiteConfig } from "@/lib/seo/seo.defaults";
import {
  buildOrganizationStructuredData,
  buildWebsiteStructuredData,
  serializeJsonLd,
} from "@/lib/seo/seo.structured-data";

export default async function Home() {
  const user = await CurrentUser();
  const seoConfig = await getResolvedSeoSiteConfig();

  if (isStaffRole(user?.role)) {
    const redirectTo = getDashboardRedirectForRole(user.role);
    if (redirectTo) {
      redirect(redirectTo);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildOrganizationStructuredData({
              siteName: seoConfig.siteName,
              description: seoConfig.description,
              logoPath: seoConfig.logoPath,
              socialProfiles: seoConfig.socialProfiles,
            }),
            buildWebsiteStructuredData({
              siteName: seoConfig.siteName,
              description: seoConfig.description,
            }),
          ),
        }}
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>
    </main>
  );
}
