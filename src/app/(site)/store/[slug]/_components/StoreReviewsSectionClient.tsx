"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BadgeCheck,
  MessageSquareQuote,
  PencilLine,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createStoreReview } from "@/actions/storeReviews/createStoreReview";
import { deleteStoreReview } from "@/actions/storeReviews/deleteStoreReview";
import { getReviewableStorePurchases } from "@/actions/storeReviews/getReviewableStorePurchases";
import { getStoreReviews } from "@/actions/storeReviews/getStoreReviews";
import { getStoreReviewSummary } from "@/actions/storeReviews/getStoreReviewSummary";
import { updateStoreReview } from "@/actions/storeReviews/updateStoreReview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type StoreReviewSummary = Awaited<ReturnType<typeof getStoreReviewSummary>>;
type StoreReviewsPage = Awaited<ReturnType<typeof getStoreReviews>>;
type ReviewableStorePurchasesResult = Awaited<
  ReturnType<typeof getReviewableStorePurchases>
>;
type ReviewableStorePurchase =
  ReviewableStorePurchasesResult["purchases"][number];
type StoreReviewRecord = StoreReviewsPage["items"][number];

function formatReviewDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getReviewerInitial(name?: string | null): string {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "N";
  }

  return trimmed.charAt(0).toUpperCase();
}

function InlineStars({ rating }: { rating: number }) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, normalizedRating - index));

        return (
          <div key={index} className="relative h-3.5 w-3.5">
            <Star className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-700" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="h-3.5 w-3.5 fill-[#3c9ee0] text-[#3c9ee0]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewAvatar({ review }: { review: StoreReviewRecord }) {
  const name = review.user.name || "NexaMart shopper";

  if (review.user.image) {
    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Image
          src={review.user.image}
          alt={name}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-100 text-sm font-semibold text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      {getReviewerInitial(review.user.name)}
    </div>
  );
}

function StoreReviewCard({ review }: { review: StoreReviewRecord }) {
  const wasEdited = review.updatedAt.getTime() !== review.createdAt.getTime();

  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.2)] dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ReviewAvatar review={review} />

            <div className="min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm font-semibold tracking-[0.01em] text-slate-950 dark:text-zinc-50">
                  {review.user.name || "NexaMart shopper"}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Completed purchase
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <span className="text-xs font-semibold">
                    {review.rating.toFixed(1)}
                  </span>
                  <InlineStars rating={review.rating} />
                </div>
                <span className="text-slate-400 dark:text-zinc-500">&bull;</span>
                <time
                  dateTime={review.createdAt.toISOString()}
                  className="text-sm text-slate-500 dark:text-zinc-400"
                >
                  {formatReviewDate(review.createdAt)}
                </time>
                {wasEdited ? (
                  <>
                    <span className="text-slate-400 dark:text-zinc-500">
                      &bull;
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      Edited
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Store experience
          </div>
        </header>

        {review.title ? (
          <h4 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
            {review.title}
          </h4>
        ) : null}

        {review.comment ? (
          <div className="border-l-2 border-[#3c9ee0]/20 pl-4 sm:pl-5">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-zinc-300">
              {review.comment}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            This customer left a rating without written feedback.
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyReviewState({ canReview }: { canReview: boolean }) {
  return (
    <Empty className="mx-auto w-full rounded-[28px] border-slate-200/80 bg-white py-12 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950">
      <EmptyHeader className="max-w-xl">
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-2xl bg-slate-50 text-slate-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
        >
          <MessageSquareQuote className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-slate-950 dark:text-zinc-100">
          No store reviews yet
        </EmptyTitle>
        <EmptyDescription className="max-w-md text-slate-500 dark:text-zinc-400">
          {canReview
            ? "You can be the first shopper to leave trusted feedback for this store."
            : "Verified feedback from completed purchases will appear here once customers start reviewing this store."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function StoreReviewsSectionClient({
  store,
  initialSummary,
  initialReviewsPage,
  initialReviewablePurchases,
  isAuthenticated,
}: {
  store: {
    id: string;
    slug: string;
    name: string;
  };
  initialSummary: Pick<
    StoreReviewSummary,
    "averageRating" | "reviewCount" | "ratingBreakdown"
  >;
  initialReviewsPage: StoreReviewsPage;
  initialReviewablePurchases: ReviewableStorePurchase[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [reviewsPage, setReviewsPage] = useState(initialReviewsPage);
  const [reviewablePurchases, setReviewablePurchases] = useState(
    initialReviewablePurchases,
  );
  const [selectedSellerGroupId, setSelectedSellerGroupId] = useState(
    initialReviewablePurchases[0]?.sellerGroupId ?? "",
  );
  const [rating, setRating] = useState(
    initialReviewablePurchases[0]?.existingReview?.rating ?? 5,
  );
  const [title, setTitle] = useState(
    initialReviewablePurchases[0]?.existingReview?.title ?? "",
  );
  const [comment, setComment] = useState(
    initialReviewablePurchases[0]?.existingReview?.comment ?? "",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const [isRefreshingPage, startRefreshTransition] = useTransition();

  const selectedPurchase = useMemo(
    () =>
      reviewablePurchases.find(
        (purchase) => purchase.sellerGroupId === selectedSellerGroupId,
      ) ?? reviewablePurchases[0],
    [reviewablePurchases, selectedSellerGroupId],
  );

  useEffect(() => {
    if (!selectedPurchase) {
      setRating(5);
      setTitle("");
      setComment("");
      return;
    }

    setSelectedSellerGroupId(selectedPurchase.sellerGroupId);
    setRating(selectedPurchase.existingReview?.rating ?? 5);
    setTitle(selectedPurchase.existingReview?.title ?? "");
    setComment(selectedPurchase.existingReview?.comment ?? "");
  }, [selectedPurchase]);

  const canReview = reviewablePurchases.length > 0;
  const submitLabel = selectedPurchase?.existingReview
    ? "Update review"
    : "Publish review";

  const refreshStoreReviewState = (page = 1) => {
    startRefreshTransition(async () => {
      try {
        const [nextSummary, nextReviewsPage, nextReviewable] = await Promise.all([
          getStoreReviewSummary({ storeId: store.id }),
          getStoreReviews({
            storeId: store.id,
            page,
            pageSize: reviewsPage.pageSize,
          }),
          getReviewableStorePurchases({ storeId: store.id }),
        ]);

        setSummary({
          averageRating: nextSummary.averageRating,
          reviewCount: nextSummary.reviewCount,
          ratingBreakdown: nextSummary.ratingBreakdown,
        });
        setReviewsPage(nextReviewsPage);
        setReviewablePurchases(nextReviewable.purchases);

        if (nextReviewable.purchases.length > 0) {
          const nextSelected =
            nextReviewable.purchases.find(
              (purchase) =>
                purchase.sellerGroupId === selectedPurchase?.sellerGroupId,
            ) ?? nextReviewable.purchases[0];

          setSelectedSellerGroupId(nextSelected.sellerGroupId);
        } else {
          setSelectedSellerGroupId("");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh store reviews right now.";
        toast.error(message);
      }
    });
  };

  const handleSubmit = () => {
    if (!selectedPurchase) {
      toast.error("Select a completed purchase before leaving a review.");
      return;
    }

    startSavingTransition(async () => {
      try {
        if (selectedPurchase.existingReview) {
          await updateStoreReview({
            reviewId: selectedPurchase.existingReview.id,
            rating,
            title,
            comment,
          });
          toast.success("Your store review has been updated.");
        } else {
          await createStoreReview({
            storeId: store.id,
            orderId: selectedPurchase.orderId,
            sellerGroupId: selectedPurchase.sellerGroupId,
            rating,
            title,
            comment,
          });
          toast.success("Your store review has been published.");
        }

        setDialogOpen(false);
        refreshStoreReviewState(1);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to save your store review right now.";
        toast.error(message);
      }
    });
  };

  const handleDelete = () => {
    if (!selectedPurchase?.existingReview) {
      return;
    }

    startSavingTransition(async () => {
      try {
        await deleteStoreReview({
          reviewId: selectedPurchase.existingReview.id,
        });
        toast.success("Your store review has been deleted.");
        refreshStoreReviewState(1);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to delete your store review right now.";
        toast.error(message);
      }
    });
  };

  return (
    <section className="mt-12 space-y-6">
      <div className="flex flex-col gap-6 rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.22)] dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
              Store reviews
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
              Trusted feedback for {store.name}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
              Marketplace feedback from shoppers whose purchases with this store
              reached completion.
            </p>
          </div>

          {canReview ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-[#3c9ee0] px-5 text-white hover:bg-[#2d8fd4]">
                  {reviewablePurchases.some((purchase) => purchase.existingReview)
                    ? "Write or edit your review"
                    : "Write a review"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-[24px] border-slate-200/80 p-0 dark:border-zinc-800">
                <div className="space-y-6 p-6">
                  <DialogHeader className="space-y-2 text-left">
                    <DialogTitle className="text-xl text-slate-950 dark:text-zinc-50">
                      {selectedPurchase?.existingReview
                        ? "Edit your store review"
                        : "Review this store"}
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-slate-500 dark:text-zinc-400">
                      Reviews unlock only after a purchase reaches the completed
                      state in NexaMart.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                        Completed purchase
                      </label>
                      <Select
                        value={selectedSellerGroupId}
                        onValueChange={setSelectedSellerGroupId}
                      >
                        <SelectTrigger className="w-full rounded-xl border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                          <SelectValue placeholder="Select a completed purchase" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewablePurchases.map((purchase) => (
                            <SelectItem
                              key={purchase.sellerGroupId}
                              value={purchase.sellerGroupId}
                            >
                              {purchase.trackingNumber
                                ? `Order #${purchase.trackingNumber}`
                                : `Order ${purchase.orderId.slice(0, 8)}`}{" "}
                              - {formatReviewDate(purchase.purchasedAt)}
                              {purchase.existingReview ? " - existing review" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                        Rating
                      </label>
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            {rating.toFixed(1)}
                          </span>
                          <InlineStars rating={rating} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                        Title
                      </label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Sum up your store experience"
                        maxLength={120}
                        className="rounded-xl border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                        Review
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Tell other shoppers what the store experience was like."
                        maxLength={1500}
                        rows={6}
                        className="rounded-2xl border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      />
                    </div>
                  </div>

                  <DialogFooter className="border-t border-slate-200/80 pt-5 dark:border-zinc-800">
                    {selectedPurchase?.existingReview ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="mr-auto rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete review
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={isSaving}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSaving}
                      className="rounded-full bg-[#3c9ee0] text-white hover:bg-[#2d8fd4]"
                    >
                      <PencilLine className="h-4 w-4" />
                      {isSaving ? "Saving..." : submitLabel}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        <div className="grid gap-5 border-t border-slate-200/80 pt-6 dark:border-zinc-800 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                Average rating
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
                {summary.averageRating.toFixed(1)}
              </p>
              <div className="mt-2">
                <InlineStars rating={summary.averageRating} />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Based on {summary.reviewCount} completed purchase review
                {summary.reviewCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                Total reviews
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
                {summary.reviewCount}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Verified store feedback from NexaMart shoppers
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-950 dark:text-zinc-100">
                Rating distribution
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                A quick look at how customers rate their overall store experience.
              </p>
            </div>
            <div className="space-y-3">
              {summary.ratingBreakdown.map((row) => (
                <div
                  key={row.rating}
                  className="grid grid-cols-[44px_minmax(0,1fr)_32px] items-center gap-3"
                >
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-zinc-300">
                    <span>{row.rating}</span>
                    <Star className="h-3.5 w-3.5 fill-[#3c9ee0] text-[#3c9ee0]" />
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#3c9ee0] transition-[width]"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>

                  <span className="text-right text-xs font-medium text-slate-500 dark:text-zinc-400">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {summary.reviewCount > 0 ? (
        <>
          <div className="space-y-4">
            {reviewsPage.items.map((review) => (
              <StoreReviewCard key={review.id} review={review} />
            ))}
          </div>

          {reviewsPage.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Page {reviewsPage.page} of {reviewsPage.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refreshStoreReviewState(reviewsPage.page - 1)}
                  disabled={!reviewsPage.hasPreviousPage || isRefreshingPage}
                  className="rounded-full"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refreshStoreReviewState(reviewsPage.page + 1)}
                  disabled={!reviewsPage.hasNextPage || isRefreshingPage}
                  className="rounded-full"
                >
                  {isRefreshingPage ? "Loading..." : "Next"}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyReviewState canReview={canReview && isAuthenticated} />
      )}
    </section>
  );
}
