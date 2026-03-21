import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireModerator } from "@/lib/moderation/guardModerator";
import { getModeratorProductById } from "@/lib/moderation/getModeratorProducts";
import {
  ProductFlagBadge,
  ProductPublishBadge,
  ProductSeverityBadge,
} from "../_components/ModeratorProductBadges";
import { ModeratorProductActionButtons } from "./_components/ModeratorProductActionButtons";

const styles = {
  premiumSurface:
    "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  sectionHeader:
    "border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(60,158,224,0.08),rgba(255,255,255,0.96))] px-6 py-4 dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(60,158,224,0.12),rgba(24,24,27,0.96))]",
  title: "text-base font-semibold text-slate-950 dark:text-zinc-100",
  description: "text-sm text-slate-500 dark:text-zinc-400",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function PremiumSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.premiumSurface}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default async function ModeratorProductDetailsPage(props: {
  params: Promise<{ productId: string }>;
}) {
  await requireModerator();
  const { productId } = await props.params;

  const product = await getModeratorProductById(productId);

  if (!product) {
    notFound();
  }

  const highestSeverity =
    product.incidents.find((item) => item.severity === "CRITICAL")?.severity ??
    product.incidents.find((item) => item.severity === "HIGH")?.severity ??
    product.incidents.find((item) => item.severity === "MEDIUM")?.severity ??
    product.incidents.find((item) => item.severity === "LOW")?.severity ??
    null;

  const hasOpenIncident = product.incidents.some(
    (item) => item.status === "OPEN",
  );

  return (
    <div className="space-y-6 text-slate-950 dark:text-zinc-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Product Moderation Details
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review listing content, store context, linked incidents, and
            moderator actions for this product.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/marketplace/dashboard/moderator/products">
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <PremiumSection
            title="Product Summary"
            description="Core listing details, pricing, moderation badges, and catalog context."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Product Name</div>
                <div className="font-medium">{product.name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Product ID</div>
                <div className="font-medium">{product.id}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Store</div>
                <div className="font-medium">{product.store.name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="font-medium">{product.category.name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Brand</div>
                <div className="font-medium">{product.Brand?.name ?? "N/A"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">
                  {product.isFoodProduct ? "FOOD" : "GENERAL"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="font-medium">{formatMoney(product.basePriceUSD)}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Old Price</div>
                <div className="font-medium">
                  {product.oldPriceUSD ? formatMoney(product.oldPriceUSD) : "N/A"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Publish State</div>
                <ProductPublishBadge published={product.isPublished} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Flags</div>
                <ProductFlagBadge
                  count={product.incidents.length}
                  hasOpenIncident={hasOpenIncident}
                />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Highest Severity
                </div>
                <ProductSeverityBadge severity={highestSeverity} />
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Review Count</div>
                <div className="font-medium">{product._count.reviews}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Average Rating
                </div>
                <div className="font-medium">{product.averageRating}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Updated</div>
                <div className="font-medium">
                  {new Date(product.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </PremiumSection>

          <PremiumSection
            title="Description"
            description="Moderator-facing view of the public listing copy."
          >
            <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap">
              {product.description}
            </div>
          </PremiumSection>

          <PremiumSection
            title="Moderator Actions"
            description="Adjust publish visibility with state-aware controls and audit logging."
          >
            <ModeratorProductActionButtons
              productId={product.id}
              isPublished={product.isPublished}
            />
          </PremiumSection>

          <PremiumSection
            title="Linked Product Incidents"
            description="Recent incidents tied to the product or any uploaded product image."
          >
            <div className="space-y-3">
              {product.incidents.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No product-related incidents found.
                </div>
              ) : (
                product.incidents.map((incident) => (
                  <div key={incident.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{incident.reason}</div>
                        <div className="text-xs text-muted-foreground">
                          {incident.targetType} / {incident.targetId}
                        </div>
                      </div>

                      <ProductSeverityBadge severity={incident.severity} />
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      {incident.decision} / {incident.status} /{" "}
                      {incident.reviewStatus} /{" "}
                      {new Date(incident.createdAt).toLocaleString()}
                    </div>

                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/marketplace/dashboard/moderator/incidents/${incident.id}`}
                        >
                          Open Incident
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PremiumSection>
        </div>

        <div className="space-y-6">
          <PremiumSection
            title="Images"
            description="Current product media available on the listing."
          >
            <div className="grid grid-cols-2 gap-3">
              {product.images.length === 0 ? (
                <div className="col-span-2 text-sm text-muted-foreground">
                  No images uploaded.
                </div>
              ) : (
                product.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-xl border bg-muted"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))
              )}
            </div>
          </PremiumSection>

          <PremiumSection
            title="Store Context"
            description="Operational status of the store that owns this listing."
          >
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Store Name</div>
                <div className="font-medium">{product.store.name}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Store Slug</div>
                <div className="font-medium">{product.store.slug}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Store Active</div>
                <div className="font-medium">
                  {product.store.isActive ? "Yes" : "No"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Store Suspended
                </div>
                <div className="font-medium">
                  {product.store.isSuspended ? "Yes" : "No"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Store Verified
                </div>
                <div className="font-medium">
                  {product.store.isVerified ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </PremiumSection>

          <PremiumSection
            title="Variants"
            description="SKU-level inventory and pricing snapshots."
          >
            <div className="space-y-3">
              {product.variants.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No variants found.
                </div>
              ) : (
                product.variants.map((variant) => (
                  <div key={variant.id} className="rounded-xl border p-3">
                    <div className="font-medium">{variant.sku}</div>
                    <div className="text-xs text-muted-foreground">
                      {variant.color ?? "N/A"} / {variant.size ?? "N/A"}
                    </div>
                    <div className="mt-1 text-sm">
                      Stock: {variant.stock} / Price:{" "}
                      {formatMoney(variant.priceUSD)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </PremiumSection>

          <PremiumSection
            title="Recent Reviews"
            description="Latest buyer feedback that may indicate quality or policy issues."
          >
            <div className="space-y-3">
              {product.reviews.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No recent reviews.
                </div>
              ) : (
                product.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border p-3">
                    <div className="font-medium">
                      {review.user.name ||
                        review.user.username ||
                        review.user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Rating: {review.rating} /{" "}
                      {new Date(review.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm">
                      {review.comment || "No review comment."}
                    </div>
                  </div>
                ))
              )}
            </div>
          </PremiumSection>
        </div>
      </div>
    </div>
  );
}
