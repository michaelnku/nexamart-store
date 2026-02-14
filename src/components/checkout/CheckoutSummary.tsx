"use client";

import Image from "next/image";
import { useTransition, useState, useMemo, useEffect, useRef } from "react";
import { placeOrderAction } from "@/actions/checkout/placeOrder";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AddressForm from "./AddressForm";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2 } from "lucide-react";
import ky from "ky";
import { useCartStore } from "@/stores/useCartstore";
import { useCurrentUserQuery } from "@/stores/useCurrentUserQuery";
import { useFormatMoneyFromUSD } from "@/hooks/useFormatMoneyFromUSD";
import { useCurrencyStore } from "@/stores/useCurrencyStore";
import { useQuery } from "@tanstack/react-query";
import { getEligibleClaimedCouponsAction } from "@/actions/checkout/getEligibleClaimedCoupons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const deliveryMethod = [
  {
    key: "HOME_DELIVERY",
    label: "Home Delivery",
    desc: "Delivered to your chosen address",
  },
  {
    key: "STORE_PICKUP",
    label: "Store Pickup",
    desc: "Pick up from sellerâ€™s pickup point",
  },
  {
    key: "STATION_PICKUP",
    label: "Station Pickup",
    desc: "Pick up from one of our fulfillment stations",
  },
  {
    key: "EXPRESS",
    label: "Express Delivery",
    desc: "Same-day or next-day fast delivery",
  },
] as const;

type CheckoutCartItem = {
  id: string;
  quantity: number;
  variant?: {
    priceUSD: number;
    color?: string | null;
    size?: string | null;
  } | null;
  product: {
    id: string;
    name: string;
    basePriceUSD: number;
    images: { imageUrl: string }[];
    store: {
      id: string;
      shippingRatePerMile: number;
    };
  };
};

type CheckoutCart = {
  items: CheckoutCartItem[];
};

type CheckoutAddress = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  country?: string;
  distanceInMiles?: number;
};

type PaymentMethod = "CARD" | "WALLET";

type Props = {
  cart: CheckoutCart;
  address: CheckoutAddress | null;
};

export default function CheckoutSummary({ cart, address }: Props) {
  const { currency } = useCurrencyStore();
  const formatMoneyFromUSD = useFormatMoneyFromUSD();

  const router = useRouter();

  const { data: user } = useCurrentUserQuery();
  const [pending, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [deliveryType, setDeliveryType] = useState<
    "HOME_DELIVERY" | "STORE_PICKUP" | "STATION_PICKUP" | "EXPRESS"
  >("HOME_DELIVERY");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [discountUSD, setDiscountUSD] = useState(0);
  const [activeDiscountUSD, setActiveDiscountUSD] = useState(0);
  const [applyCoupon, setApplyCoupon] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOptOut, setCouponOptOut] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [eligibleCoupons, setEligibleCoupons] = useState<
    {
      id: string;
      code: string;
      type: string;
      value: number;
      discountAmount: number;
    }[]
  >([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const items = useCartStore((state) => state.items);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet");
      if (!res.ok) return null;
      return res.json() as Promise<{ balance: number }>;
    },
  });

  const subtotalUSD = useMemo(
    () =>
      cart.items.reduce((sum, item) => {
        const priceUSD = item.variant?.priceUSD ?? item.product.basePriceUSD;

        return sum + item.quantity * priceUSD;
      }, 0),
    [cart.items],
  );

  const shippingUSD = useMemo(() => {
    if (!address) return null;

    const miles = address.distanceInMiles ?? 0;
    const perStoreRate = new Map<string, number>();

    for (const item of cart.items) {
      perStoreRate.set(
        item.product.store.id,
        item.product.store.shippingRatePerMile ?? 0,
      );
    }

    return Array.from(perStoreRate.values()).reduce(
      (sum, rate) => sum + rate * miles,
      0,
    );
  }, [address, cart.items]);

  const totalUSD = Math.max(0, subtotalUSD + (shippingUSD ?? 0) - discountUSD);

  const approxUSD = currency !== "USD" ? totalUSD : null;

  const canPayWithWallet =
    wallet && wallet.balance > 0 && wallet.balance >= totalUSD;

  const handlePlaceOrder = (paymentMethod: PaymentMethod) => {
    if (!address) {
      toast.error("Add a delivery address first");
      return;
    }

    startTransition(async () => {
      const res = await placeOrderAction({
        addressId: address.id,
        paymentMethod,
        deliveryType,
        distanceInMiles: address.distanceInMiles ?? 0,
        couponId: applyCoupon && appliedCoupon ? appliedCoupon.id : null,
        idempotencyKey: idempotencyKeyRef.current,
      });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      useCartStore.getState().clearCart();
      idempotencyKeyRef.current = crypto.randomUUID();
      toast.success("Order placed successfully!");
      router.push(`/customer/order/success/${res.orderId}`);
    });
  };


  const onCheckout = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to checkout.");
      return;
    }

    if (!address) {
      toast.error("Add a delivery address first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ky
        .post("/api/checkout", {
          json: {
            cartItems: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity: item.quantity,
            })),
            userId: user.id,
            addressId: address.id,
            deliveryType,
            distanceInMiles: address.distanceInMiles ?? 0,
            paymentMethod: "CARD",
            couponId: applyCoupon && appliedCoupon ? appliedCoupon.id : null,
          },
        })
        .json<{ url: string }>();

      window.location.href = response.url;
    } catch (error) {
      console.error(error);
      toast.error("Checkout failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setCouponLoading(true);
      try {
        const res = await getEligibleClaimedCouponsAction({
          subtotalUSD,
          shippingUSD: shippingUSD ?? 0,
        });

        if (cancelled) return;

        if (!res.coupons.length) {
          setAppliedCoupon(null);
          setActiveDiscountUSD(0);
          setDiscountUSD(0);
          setApplyCoupon(false);
          setEligibleCoupons([]);
          setSelectedCouponId(null);
          return;
        }

        setEligibleCoupons(res.coupons);
        setSelectedCouponId(res.coupons[0].id);
        setAppliedCoupon({
          id: res.coupons[0].id,
          code: res.coupons[0].code,
          type: res.coupons[0].type,
          value: res.coupons[0].value,
        });
        setActiveDiscountUSD(res.coupons[0].discountAmount);

        if (!couponOptOut) {
          setApplyCoupon(true);
          setDiscountUSD(res.coupons[0].discountAmount);
        }
      } catch {
        if (cancelled) return;
        setAppliedCoupon(null);
        setActiveDiscountUSD(0);
        setDiscountUSD(0);
        setApplyCoupon(false);
        setEligibleCoupons([]);
        setSelectedCouponId(null);
      } finally {
        if (!cancelled) setCouponLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [subtotalUSD, shippingUSD, couponOptOut]);

  if (!cart || cart.items.length === 0)
    return (
      <div className="min-h-full px-4 py-24 text-center space-y-4">
        <p className="text-gray-500">Cart is empty - add items before checking out</p>
        <Button asChild variant="outline">
          <a href="/customer/order/history">View Orders</a>
        </Button>
      </div>
    );

  return (
    <>
      <div className="max-w-6xl mx-auto min-h-screen px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-black">Your items</h2>

          {cart.items.map((item) => {
            const priceUSD =
              item.variant?.priceUSD ?? item.product.basePriceUSD;

            return (
              <div
                key={item.id}
                className="flex gap-4 pb-6 border-b border-gray-200"
              >
                <div className="relative w-36 h-36 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={item.product.images[0]?.imageUrl ?? "/placeholder.png"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-tight">
                    {item.product.name}
                  </p>
                  {item.variant && (
                    <p className="text-sm text-gray-500">
                      {item.variant.color} {item.variant.size}
                    </p>
                  )}
                  <p className="font-semibold text-lg text-black mt-1">
                    {formatMoneyFromUSD(priceUSD * item.quantity)}
                    <span className="text-sm text-gray-500 ml-1">
                      ({formatMoneyFromUSD(priceUSD)} Ã— {item.quantity})
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl p-5 border bg-white shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-black">
              Delivery Method
            </h2>

            <div className="grid gap-3">
              {deliveryMethod.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setDeliveryType(option.key)}
                  className={`border rounded-lg p-4 text-left transition ${
                    deliveryType === option.key
                      ? "border-[var(--brand-blue)] bg-blue-50/60"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <p className="font-semibold text-sm">{option.label}</p>
                  <p className="text-[12px] text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-5 border bg-white shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-black">
              Delivery Address
            </h2>

            {address ? (
              <div className="text-sm text-gray-700 leading-relaxed">
                <p className="font-medium">{address.fullName}</p>
                <p>{address.phone}</p>
                <p>{address.street}</p>
                <p>
                  {address.city}, {address.state}
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-500">No delivery address added</p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white transition"
              onClick={() => setOpenAddress(true)}
            >
              {address ? "Change Address" : "Add Address"}
            </Button>
          </div>

          <div className="rounded-xl p-5 border bg-white shadow-md space-y-3 sticky top-28">
            <h2 className="text-xl font-semibold text-black">Order Summary</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Items subtotal</span>
                <span>{formatMoneyFromUSD(subtotalUSD)}</span>
              </div>

              <div className="flex justify-between">
                <span>Coupon</span>
                <div className="w-[200px] space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--brand-blue)]"
                      checked={applyCoupon}
                      disabled={!appliedCoupon || couponLoading}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setApplyCoupon(checked);
                        if (!checked) {
                          setCouponOptOut(true);
                          setDiscountUSD(0);
                        } else {
                          setCouponOptOut(false);
                          setDiscountUSD(activeDiscountUSD);
                        }
                      }}
                    />
                    {couponLoading
                      ? "Checking coupons..."
                      : appliedCoupon
                        ? `Apply ${appliedCoupon.code}`
                        : "No active coupons"}
                  </label>

                  {!appliedCoupon && !couponLoading && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/customer/coupons")}
                      className="w-full"
                    >
                      Check coupons to claim
                    </Button>
                  )}

                  {eligibleCoupons.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCouponDialogOpen(true)}
                      className="w-full"
                    >
                      Change coupon
                    </Button>
                  )}

                  {appliedCoupon && applyCoupon && discountUSD > 0 && (
                    <p className="text-[11px] text-green-600">
                      Applied {appliedCoupon.code} (-
                      {formatMoneyFromUSD(discountUSD)})
                    </p>
                  )}
                </div>
              </div>

              {discountUSD > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>-{formatMoneyFromUSD(discountUSD)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shippingUSD !== null
                    ? formatMoneyFromUSD(shippingUSD)
                    : "Add address to calculate"}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold text-black">
                <span>Total</span>
                <div className="space-y-1">
                  <span className="font-semibold">
                    {formatMoneyFromUSD(totalUSD)}
                  </span>

                  {approxUSD && (
                    <p className="text-xs text-muted-foreground italics">
                      â‰ˆ ${approxUSD.toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onCheckout}
                disabled={isLoading}
                className="py-6 bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white font-semibold rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Pay with Card"
                )}
              </Button>
              <Button
                onClick={() => handlePlaceOrder("WALLET")}
                variant={"outline"}
                disabled={!canPayWithWallet || pending}
                className={`py-6 font-semibold rounded-lg ${
                  canPayWithWallet
                    ? ""
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {pending ? (
                  <Loader2 className="animate-spin" />
                ) : wallet?.balance === 0 ? (
                  "Wallet Balance is $0.00"
                ) : wallet && wallet.balance < totalUSD ? (
                  "Insufficient Wallet Balance"
                ) : (
                  "Pay with Wallet"
                )}
              </Button>
            </div>

            <p className="text-[11px] text-gray-500 text-center">
              By placing your order, you agree to NexaMartâ€™s Terms of Use and
              Privacy Notice.
            </p>
          </div>
        </div>
      </div>

      <Drawer open={openAddress} onOpenChange={setOpenAddress}>
        <DrawerContent className="w-full max-w-lg mx-auto p-4 space-y-3">
          <DrawerHeader>
            <VisuallyHidden>
              <DrawerTitle>Delivery Address</DrawerTitle>
            </VisuallyHidden>
            <p className="font-semibold text-lg text-center">
              Delivery Address
            </p>
          </DrawerHeader>

          <AddressForm
            onSuccess={() => {
              setOpenAddress(false);
              router.refresh();
            }}
          />
        </DrawerContent>
      </Drawer>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a coupon</DialogTitle>
            <DialogDescription>
              Choose one of your active claimed coupons to apply.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {eligibleCoupons.map((c) => (
              <label
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="coupon"
                    className="h-4 w-4 accent-[var(--brand-blue)]"
                    checked={selectedCouponId === c.id}
                    onChange={() => setSelectedCouponId(c.id)}
                  />
                  <div>
                    <p className="font-medium">{c.code}</p>
                    <p className="text-xs text-muted-foreground">
                      Saves {formatMoneyFromUSD(c.discountAmount)}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {c.type === "PERCENTAGE"
                    ? `${c.value}% OFF`
                    : c.type === "FIXED"
                      ? `$${c.value} OFF`
                      : "Free Shipping"}
                </span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCouponDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const selected = eligibleCoupons.find(
                  (c) => c.id === selectedCouponId,
                );
                if (!selected) return;

                setAppliedCoupon({
                  id: selected.id,
                  code: selected.code,
                  type: selected.type,
                  value: selected.value,
                });
                setActiveDiscountUSD(selected.discountAmount);

                if (applyCoupon) {
                  setDiscountUSD(selected.discountAmount);
                }

                setCouponDialogOpen(false);
              }}
            >
              Apply selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
