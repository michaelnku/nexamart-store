import Image from "next/image";
import { BadgeCheck, MessageSquareQuote, Star } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { prisma } from "@/lib/prisma";
import StarRating from "./StarRating";

interface ReviewListProps {
  productId: string;
}

type ReviewRecord = Awaited<ReturnType<typeof getProductReviews>>[number];

async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

function formatReviewDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function getReviewerInitial(name?: string | null): string {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "A";
  }

  return trimmed.charAt(0).toUpperCase();
}

function buildRatingDistribution(reviews: ReviewRecord[]) {
  const totalReviews = reviews.length;

  return [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length;

    return {
      rating,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    };
  });
}

function ReviewAvatar({ review }: { review: ReviewRecord }) {
  const name = review.user.name || "Anonymous";

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

function ReviewCard({ review }: { review: ReviewRecord }) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.18)] transition-colors dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <ReviewAvatar review={review} />

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold tracking-[0.01em] text-slate-950 dark:text-zinc-50">
                  {review.user.name || "Anonymous"}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified purchase
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readonly size="sm" />
                  <span className="font-medium text-slate-700 dark:text-zinc-200">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-400 dark:text-zinc-500">
                  &bull;
                </span>
                <time
                  dateTime={review.createdAt.toISOString()}
                  className="text-sm text-slate-500 dark:text-zinc-400"
                >
                  {formatReviewDate(review.createdAt)}
                </time>
              </div>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-zinc-900 dark:text-zinc-300">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Customer review
          </div>
        </header>

        {review.comment ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/70 sm:px-5">
            <p className="text-sm leading-7 text-slate-700 dark:text-zinc-300">
              {review.comment}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            This customer left a rating without additional written feedback.
          </div>
        )}
      </div>
    </article>
  );
}

function ReviewSummary({
  averageRating,
  totalReviews,
  distribution,
}: {
  averageRating: number;
  totalReviews: number;
  distribution: ReturnType<typeof buildRatingDistribution>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.12)] dark:border-zinc-800 dark:bg-zinc-950/60 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
              Customer feedback
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
              Real purchase reviews from NexaMart shoppers
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {totalReviews > 0
                ? "Read recent experiences to help you decide with confidence."
                : "This product has not received any verified customer feedback yet."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                  Average rating
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
                {averageRating.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Based on {totalReviews} review{totalReviews === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                Review count
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
                {totalReviews}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Verified marketplace customer reviews
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3">
            {distribution.map((row) => (
              <div
                key={row.rating}
                className="grid grid-cols-[44px_minmax(0,1fr)_30px] items-center gap-3"
              >
                <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-zinc-300">
                  <span>{row.rating}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[#3c9ee0]/80 transition-[width]"
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
  );
}

function EmptyReviewState() {
  return (
    <Empty className="mx-auto w-full max-w-7xl rounded-3xl border-slate-200/80 bg-slate-50/75 py-10 dark:border-zinc-800 dark:bg-zinc-950/45">
      <EmptyHeader className="max-w-lg">
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-2xl bg-white text-slate-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-300"
        >
          <MessageSquareQuote className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-slate-950 dark:text-zinc-100">
          No customer reviews yet
        </EmptyTitle>
        <EmptyDescription className="max-w-md text-slate-500 dark:text-zinc-400">
          This product has not received any verified customer feedback yet.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default async function ReviewList({ productId }: ReviewListProps) {
  const reviews = await getProductReviews(productId);
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
  const distribution = buildRatingDistribution(reviews);

  return (
    <div className="space-y-5 max-w-7xl w-full mx-auto">
      <ReviewSummary
        averageRating={averageRating}
        totalReviews={totalReviews}
        distribution={distribution}
      />

      {totalReviews > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <EmptyReviewState />
      )}
    </div>
  );
}
