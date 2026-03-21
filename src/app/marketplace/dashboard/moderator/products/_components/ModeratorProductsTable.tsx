import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ProductFlagBadge,
  ProductPublishBadge,
  ProductSeverityBadge,
} from "./ModeratorProductBadges";
import { formatModerationDateTime } from "@/lib/moderation/formatters";

type ModeratorProductItem = Awaited<
  ReturnType<
    typeof import("@/lib/moderation/getModeratorProducts").getModeratorProducts
  >
>["items"][number];

const styles = {
  premiumSurface:
    "rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
  tintedSurface:
    "rounded-xl border border-slate-200/70 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/70",
  token:
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ModeratorProductsTable({
  products,
}: {
  products: ModeratorProductItem[];
}) {
  if (products.length === 0) {
    return (
      <div
        className={`${styles.premiumSurface} py-10 text-center text-muted-foreground`}
      >
        No products found for the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {products.map((product) => (
          <article key={product.id} className={`${styles.tintedSurface} p-4`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted">
                {product.images[0]?.imageUrl ? (
                  <Image
                    src={product.images[0].imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className={styles.token}>Product</p>
                <p className="break-words font-semibold text-slate-950 dark:text-zinc-100">
                  {product.name}
                </p>
                <p className="break-words text-xs text-slate-500 dark:text-zinc-400">
                  {product.store.name} / {product.store.slug}
                </p>
              </div>

              <div className="sm:ml-auto">
                <ProductPublishBadge published={product.isPublished} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className={styles.token}>Type</p>
                <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
                  {product.isFoodProduct ? "FOOD" : "GENERAL"}
                </p>
              </div>

              <div>
                <p className={styles.token}>Price</p>
                <p className="mt-1 text-base font-bold tracking-tight text-[var(--brand-blue)]">
                  {formatMoney(product.basePriceUSD)}
                </p>
              </div>

              <div>
                <p className={styles.token}>Flags</p>
                <div className="mt-1">
                  <ProductFlagBadge
                    count={product.linkedIncidentCount}
                    hasOpenIncident={product.hasOpenIncident}
                  />
                </div>
              </div>

              <div>
                <p className={styles.token}>Severity</p>
                <div className="mt-1">
                  <ProductSeverityBadge severity={product.highestSeverity} />
                </div>
              </div>

              <div>
                <p className={styles.token}>Reviews</p>
                <p className="mt-1 font-medium text-slate-700 dark:text-zinc-200">
                  {product._count.reviews}
                </p>
              </div>

              <div>
                <p className={styles.token}>Updated</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {formatModerationDateTime(product.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all text-xs text-slate-500 dark:text-zinc-400">
                {product.id}
              </p>

              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href={`/marketplace/dashboard/moderator/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Open
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden rounded-2xl border bg-background lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Publish</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border bg-muted">
                      {product.images[0]?.imageUrl ? (
                        <Image
                          src={product.images[0].imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-medium">{product.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {product.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="font-medium">{product.store.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {product.store.slug}
                  </div>
                </TableCell>

                <TableCell>
                  {product.isFoodProduct ? "FOOD" : "GENERAL"}
                </TableCell>
                <TableCell>{formatMoney(product.basePriceUSD)}</TableCell>
                <TableCell>
                  <ProductPublishBadge published={product.isPublished} />
                </TableCell>
                <TableCell>
                  <ProductFlagBadge
                    count={product.linkedIncidentCount}
                    hasOpenIncident={product.hasOpenIncident}
                  />
                </TableCell>
                <TableCell>
                  <ProductSeverityBadge severity={product.highestSeverity} />
                </TableCell>
                <TableCell>{product._count.reviews}</TableCell>
                <TableCell>
                  {formatModerationDateTime(product.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/marketplace/dashboard/moderator/products/${product.id}`}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
