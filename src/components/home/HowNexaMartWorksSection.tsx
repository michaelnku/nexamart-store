"use client";

import { ShoppingBag, Store, Bike, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HowNexaMartWorksSection() {
  const items = [
    {
      icon: ShoppingBag,
      title: "Shop",
      description:
        "Browse products from multiple sellers, place orders, pay securely, and track delivery updates from checkout to arrival.",
    },
    {
      icon: Store,
      title: "Sell",
      description:
        "Open a store, list products, manage inventory, receive orders, and fulfill customer purchases from one marketplace dashboard.",
    },
    {
      icon: Bike,
      title: "Deliver",
      description:
        "Riders manage assigned deliveries, update delivery progress, and help move orders from sellers to customers safely.",
    },
  ];

  return (
    <section className="border-y bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3c9ee0]/30 bg-[#3c9ee0]/10 px-3 py-1 text-xs font-medium text-[#3c9ee0] dark:text-[#8fd3ff]">
            <ShieldCheck className="h-4 w-4" />
            Marketplace purpose
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            How NexaMart works
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            NexaMart is a multi-vendor online marketplace for customers,
            sellers, and delivery riders. Customers shop and track orders,
            sellers manage stores and fulfill purchases, and riders handle
            delivery updates across the platform.
          </p>
        </div>

        {/* CARDS */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="group border-slate-200 dark:border-white/10 hover:border-[#3c9ee0]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                <CardHeader className="pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3c9ee0]/10 text-[#3c9ee0] dark:bg-[#3c9ee0]/15 dark:text-[#7fd1ff]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <CardTitle className="mt-4 text-lg text-slate-900 dark:text-white">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* GOOGLE AUTH NOTE */}
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-[#3c9ee0]/30 bg-[#3c9ee0]/5 dark:bg-[#3c9ee0]/10 px-6 py-5 text-center">
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-[15px]">
            Users can sign in with Google to securely access their NexaMart
            account, order history, store tools, and rider features.
          </p>
        </div>
      </div>
    </section>
  );
}
