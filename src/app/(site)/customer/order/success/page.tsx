import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";

export default async function OrderSuccessSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-red-600">Missing Stripe session id.</p>
      </div>
    );
  }

  const userId = await CurrentUserId();
  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-red-600">Unauthorized access.</p>
      </div>
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-red-600">Invalid Stripe session.</p>
      </div>
    );
  }
  const sessionUserId = session.metadata?.userId;
  const idempotencyKey = session.metadata?.idempotencyKey;

  if (!sessionUserId || sessionUserId !== userId) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-red-600">Unauthorized checkout session.</p>
      </div>
    );
  }

  if (!idempotencyKey) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
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
      <div className="mx-auto max-w-2xl space-y-3 py-16 flex justify-center items-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="text-xl font-semibold">Payment received</h1>
        <p className="text-sm text-gray-600">
          Your order is being finalized. This can take a few seconds.
        </p>
        <Button disabled className="w-full sm:w-auto">
          Order Slip
        </Button>
        <Link href={`/customer/order/success?session_id=${sessionId}`}>
          Refresh
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-3 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
      <h1 className="text-xl font-semibold">Payment received</h1>
      <p className="text-sm text-gray-600">
        Your order is ready. Open your order slip to view tracking details.
      </p>
      <Button asChild className="w-full sm:w-auto">
        <Link href={`/customer/order/success/${keyRecord.orderId}`}>
          Order Slip
        </Link>
      </Button>
      <Link href={`/customer/order/success?session_id=${sessionId}`}>
        Refresh
      </Link>
    </div>
  );
}
