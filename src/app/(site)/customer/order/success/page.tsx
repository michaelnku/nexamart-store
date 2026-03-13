import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { AutoRefreshOrderStatus } from "./AutoRefreshOrderStatus";

export default async function OrderSuccessSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 text-center">
        <p className="text-red-600">Missing Stripe session id.</p>
      </div>
    );
  }

  const userId = await CurrentUserId();
  if (!userId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 text-center">
        <p className="text-red-600">Unauthorized access.</p>
      </div>
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 text-center">
        <p className="text-red-600">Invalid Stripe session.</p>
      </div>
    );
  }
  const sessionUserId = session.metadata?.userId;
  const idempotencyKey = session.metadata?.idempotencyKey;

  if (!sessionUserId || sessionUserId !== userId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 text-center">
        <p className="text-red-600">Unauthorized checkout session.</p>
      </div>
    );
  }

  if (!idempotencyKey) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 text-center">
        <p className="text-red-600">Invalid checkout session metadata.</p>
      </div>
    );
  }

  const keyRecord = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
    select: { orderId: true },
  });

  if (!keyRecord?.orderId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
        <AutoRefreshOrderStatus />
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">
            Payment received
          </h1>
          <div>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              Your order is being finalized. This can take a few seconds.
            </p>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              You can wait here while we prepare your order slip, do not refresh
              or close this tab.
            </p>
          </div>

          <Link href={`/customer/order/success?session_id=${sessionId}`}>
            Refresh
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="text-xl font-semibold text-slate-950 dark:text-zinc-100">
          Payment received
        </h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Your order is ready. Open your order slip to view tracking details.
        </p>
        <Button asChild className="w-full sm:w-auto mr-6">
          <Link href={`/customer/order/success/${keyRecord.orderId}`}>
            Order Slip
          </Link>
        </Button>
        <Link href={`/customer/order/success?session_id=${sessionId}`}>
          Refresh
        </Link>
      </div>
    </div>
  );
}
