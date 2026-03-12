"use client";

import { AlertTriangle, CalendarDays, Clock, Flame, Leaf, Utensils } from "lucide-react";

import type { FoodDetails, FullProduct } from "@/lib/types";
import { normalizeFoodDetails } from "@/app/marketplace/_components/productFormHelpers";
import { Separator } from "../ui/separator";

type ProductInformationSectionsProps = {
  data: FullProduct;
  isFoodProduct?: boolean;
  foodDetails?: FoodDetails | null;
  foodEmptyState?: React.ReactNode;
};

function hasFoodMetadata(details?: FoodDetails | null) {
  return Boolean(
    details &&
      (details.ingredients?.length ||
        details.preparationTimeMinutes ||
        details.portionSize ||
        details.spiceLevel ||
        details.dietaryTags?.length ||
        details.isPerishable ||
        details.expiresAt),
  );
}

export default function ProductInformationSections({
  data,
  isFoodProduct = false,
  foodDetails,
  foodEmptyState,
}: ProductInformationSectionsProps) {
  const details = normalizeFoodDetails(foodDetails ?? data.foodDetails);
  const hasFoodDetails = hasFoodMetadata(details);
  const technicalDetails = Array.isArray(data.technicalDetails)
    ? data.technicalDetails
    : [];

  return (
    <div className="space-y-8">
      {data.description ? (
        <section className="rounded-[24px] border bg-white shadow-sm dark:bg-neutral-900">
          <h2 className="p-4 text-lg font-semibold sm:p-5">
            {isFoodProduct ? "Dish Description" : "Product Details"}
          </h2>
          <Separator />
          <p className="p-4 text-sm leading-7 text-gray-700 sm:p-5 sm:text-base dark:text-zinc-300">
            {data.description}
          </p>
        </section>
      ) : null}

      {isFoodProduct ? (
        <section className="rounded-[24px] border bg-white shadow-sm dark:bg-neutral-900">
          <h2 className="p-4 text-lg font-semibold sm:p-5">Food Information</h2>
          <Separator />

          <div className="space-y-6 p-4 sm:p-5">
            {hasFoodDetails ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {details?.preparationTimeMinutes ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
                      <Clock className="mb-2 h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.16em] text-sky-700/80 dark:text-sky-300/80">
                        Prep Time
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        Ready in {details.preparationTimeMinutes} mins
                      </p>
                    </div>
                  ) : null}

                  {details?.portionSize ? (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200">
                      <Utensils className="mb-2 h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.16em] text-violet-700/80 dark:text-violet-300/80">
                        Portion
                      </p>
                      <p className="mt-1 text-sm font-semibold">{details.portionSize}</p>
                    </div>
                  ) : null}

                  {details?.spiceLevel ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                      <Flame className="mb-2 h-4 w-4" />
                      <p className="text-xs uppercase tracking-[0.16em] text-rose-700/80 dark:text-rose-300/80">
                        Spice Level
                      </p>
                      <p className="mt-1 text-sm font-semibold">{details.spiceLevel}</p>
                    </div>
                  ) : null}

                  {details?.isPerishable || details?.expiresAt ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      {details.isPerishable ? (
                        <AlertTriangle className="mb-2 h-4 w-4" />
                      ) : (
                        <CalendarDays className="mb-2 h-4 w-4" />
                      )}
                      <p className="text-xs uppercase tracking-[0.16em] text-amber-700/80 dark:text-amber-300/80">
                        Freshness
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {details.expiresAt
                          ? `Best before ${new Date(details.expiresAt).toLocaleDateString()}`
                          : "Perishable item"}
                      </p>
                    </div>
                  ) : null}
                </div>

                {details?.dietaryTags?.length ? (
                  <div>
                    <p className="mb-3 text-sm font-medium">Dietary Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {details.dietaryTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300"
                        >
                          <Leaf className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {details?.ingredients?.length ? (
                  <div>
                    <p className="mb-3 text-sm font-medium">Ingredients</p>
                    <div className="flex flex-wrap gap-2">
                      {details.ingredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              foodEmptyState ?? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No food details have been provided yet.
                </div>
              )
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] border bg-white shadow-sm dark:bg-neutral-900">
          <h2 className="p-4 text-lg font-semibold sm:p-5">Specifications Information</h2>
          <Separator />

          <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2">
            <div className="rounded-2xl border shadow-sm">
              <h3 className="border-b p-4 text-base font-semibold">Key Features</h3>
              <div className="p-4">
                {Array.isArray(data.specifications) && data.specifications.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-zinc-300">
                    {data.specifications.map((specification, index) => (
                      <li key={index}>{specification}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specifications provided.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border shadow-sm">
              <h3 className="border-b p-4 text-base font-semibold">Technical Details</h3>
              <div className="p-4">
                {technicalDetails.length > 0 ? (
                  <dl className="space-y-3">
                    {technicalDetails.map((item, index) => {
                      const detail = item as { key: string; value: string };
                      return (
                        <div
                          key={index}
                          className="grid gap-1 sm:grid-cols-[minmax(120px,0.8fr)_1.6fr] sm:gap-3"
                        >
                          <dt className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            {detail.key}
                          </dt>
                          <dd className="text-sm text-slate-600 dark:text-zinc-400">
                            {detail.value}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No technical details provided.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
