"use client";

import Image from "next/image";
import { useTransition, useState, useMemo } from "react";
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

const deliveryMethod = [
  {
    key: "HOME_DELIVERY",
    label: "Home Delivery",
    desc: "Delivered to your chosen address",
  },
  {
    key: "STORE_PICKUP",
    label: "Store Pickup",
    desc: "Pick up from seller’s pickup point",
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
  };
};

type CheckoutCart = {
  items: CheckoutCartItem[];
};

type CheckoutAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  country?: string;
  distanceInMiles?: number;
};

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

  const items = useCartStore((state) => state.items);

  const subtotalUSD = useMemo(
    () =>
      cart.items.reduce((sum, item) => {
        const priceUSD = item.variant?.priceUSD ?? item.product.basePriceUSD;

        return sum + item.quantity * priceUSD;
      }, 0),
    [cart.items],
  );

  const approxUSD = currency !== "USD" ? subtotalUSD : null;

  const shippingUSD = useMemo(() => {
    if (!address) return null;

    switch (deliveryType) {
      case "STORE_PICKUP":
      case "STATION_PICKUP":
        return 0;
      case "EXPRESS":
        return Math.round((address.distanceInMiles ?? 0) * 1200);
      default:
        return Math.round((address.distanceInMiles ?? 0) * 700);
    }
  }, [deliveryType, address]);

  const totalUSD = subtotalUSD + (shippingUSD ?? 0);

  const handlePlaceOrder = (
    paymentMethod: "PAY_ON_DELIVERY" | "PAY_WITH_WALLET",
  ) => {
    if (!address && deliveryType !== "STORE_PICKUP") {
      toast.error("Add a delivery address first");
      return;
    }

    startTransition(() => {
      (async () => {
        const res = await placeOrderAction({
          deliveryAddress: ` ${address?.street}, ${address?.city}, ${address?.state}`,
          paymentMethod,
          deliveryType,
          distanceInMiles: address?.distanceInMiles ?? 0,
        });
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        useCartStore.getState().clearCart();
        toast.success("Order placed successfully!");
        router.push(`/customer/order/success/${res.orderId}`);
      })();
    });
  };

  if (!cart || cart.items.length === 0)
    return (
      <p className="min-h-screen text-center py-40 text-gray-500">
        Cart is empty — add items before checking out
      </p>
    );

  const onCheckout = async () => {
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
            userId: user?.id,
            deliveryType,
            distanceInMiles: address?.distanceInMiles ?? 0,
            deliveryAddress: address
              ? `${address.street}, ${address.city}, ${address.state}, ${address.country}`
              : null,
          },
        })
        .json<{ url: string }>();

      if (!user?.id) {
        toast.error("You must be logged in to checkout.");
        return;
      }

      window.location.href = response.url;
    } catch (error) {
      console.error(error);
      toast.error("Checkout failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
                      ({formatMoneyFromUSD(priceUSD)} × {item.quantity})
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* SUMMARY CARD */}
        <div className="space-y-6">
          {/* DELIVERY TYPE SELECTION */}
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

          {/* ADDRESS BOX */}
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

          {/* ORDER SUMMARY */}
          <div className="rounded-xl p-5 border bg-white shadow-md space-y-3 sticky top-28">
            <h2 className="text-xl font-semibold text-black">Order Summary</h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Items subtotal</span>
                <span>{formatMoneyFromUSD(subtotalUSD)}</span>
              </div>
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
                    {formatMoneyFromUSD(subtotalUSD)}
                  </span>

                  {approxUSD && (
                    <p className="text-xs text-muted-foreground italics">
                      ≈ ${approxUSD.toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handlePlaceOrder("PAY_WITH_WALLET")}
                disabled={pending}
                className="py-6 hidden bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white font-semibold rounded-lg"
              >
                {pending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Pay with Wallet"
                )}
              </Button>
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
                onClick={() => handlePlaceOrder("PAY_ON_DELIVERY")}
                disabled
                className="py-6 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
              >
                Pay on Delivery
              </Button>
            </div>

            <p className="text-[11px] text-gray-500 text-center">
              By placing your order, you agree to NexaMart’s Terms of Use and
              Privacy Notice.
            </p>
          </div>
        </div>
      </div>

      {/* ADDRESS DRAWER */}
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
    </>
  );
}
