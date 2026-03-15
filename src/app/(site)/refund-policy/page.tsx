export default function RefundPolicyPage() {
  return (
    <main className="min-h-full flex items-center justify-center bg-gray-50 px-4 py-16 dark:bg-neutral-950">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-10">
        <h1 className="text--brand-blue text-center text-2xl font-semibold sm:text-3xl">
          Refund & Return Policy
        </h1>

        <p className="text-center text-sm text-muted-foreground">
          Last Updated: March 2026
        </p>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <h2 className="text-base font-semibold">1. Overview</h2>
          <p>
            This Refund & Return Policy explains how refunds, returns,
            cancellations, and order issue resolutions are handled on NexaMart.
            Because NexaMart is a multi-vendor marketplace, refunds and returns
            may depend on the type of product, the seller involved, the delivery
            stage, and the specific facts of the order.
          </p>

          <h2 className="text-base font-semibold">2. Marketplace Role</h2>
          <p>
            NexaMart provides the technology platform that connects customers,
            sellers, and delivery riders. Products listed on the platform are
            offered by independent sellers. Refund decisions may involve both
            NexaMart and the seller, depending on the issue reported.
          </p>

          <h2 className="text-base font-semibold">
            3. Eligible Refund Situations
          </h2>
          <p>
            A customer may be eligible for a full or partial refund where
            applicable, including where:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>An order was paid for but not successfully fulfilled</li>
            <li>A seller cancels an order after payment</li>
            <li>The wrong item was delivered</li>
            <li>An item arrives materially damaged or defective</li>
            <li>A delivered order is incomplete</li>
            <li>
              A delivery cannot be completed for reasons attributable to the
              seller or platform
            </li>
            <li>A verified dispute is resolved in favor of the customer</li>
          </ul>

          <h2 className="text-base font-semibold">
            4. Non-Refundable Situations
          </h2>
          <p>Refunds may be denied where:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              The customer changes their mind after the seller has already
              fulfilled or prepared the order
            </li>
            <li>The issue reported cannot be verified</li>
            <li>
              The order matches the listing description and was delivered
              correctly
            </li>
            <li>
              The customer provides an incorrect delivery address or unreachable
              contact details
            </li>
            <li>
              The return request is made outside any applicable return window
            </li>
          </ul>

          <h2 className="text-base font-semibold">5. Seller Cancellations</h2>
          <p>
            If a seller cancels a paid order because the item is unavailable,
            out of stock, incorrectly priced, or cannot be fulfilled, the
            customer will generally receive an appropriate refund. Cancellation
            reasons may be shown to the customer for transparency.
          </p>

          <h2 className="text-base font-semibold">6. Customer Cancellations</h2>
          <p>
            Customers may request cancellation before an order has entered
            fulfillment, preparation, dispatch, or delivery. Once an order has
            been prepared, shipped, assigned for delivery, or otherwise
            materially processed, a refund may be denied in whole or in part.
          </p>

          <h2 className="text-base font-semibold">
            7. Delivered Orders and Disputes
          </h2>
          <p>
            If an order has been marked delivered but the customer reports a
            problem, NexaMart may investigate using available records such as
            order status, seller updates, rider confirmation, delivery proof,
            messages, and dispute submissions. Refunds for delivered orders are
            not automatic and are subject to review.
          </p>

          <h2 className="text-base font-semibold">
            8. Food, Perishable, and Sensitive Items
          </h2>
          <p>
            Food, perishable goods, personal care items, and certain sensitive
            products may not be eligible for standard returns once prepared,
            opened, or delivered, except where the item is incorrect, unsafe,
            missing, damaged, or materially different from the order.
          </p>

          <h2 className="text-base font-semibold">9. Return Conditions</h2>
          <p>
            Where a physical return is approved, the item may need to be unused,
            in substantially the same condition received, and returned with
            original packaging where reasonably applicable. Some items may not
            be returnable due to hygiene, safety, customization, or
            product-specific restrictions.
          </p>

          <h2 className="text-base font-semibold">10. Refund Method</h2>
          <p>
            Approved refunds may be issued to the original payment method, to
            the user’s NexaMart wallet where supported, or through another
            approved method determined by NexaMart. Processing times may vary
            depending on the payment provider or banking system.
          </p>

          <h2 className="text-base font-semibold">11. Partial Refunds</h2>
          <p>
            In some cases, NexaMart may issue a partial refund instead of a full
            refund, including where only part of an order is affected, where
            value was partially received, or where a fair proportional
            adjustment is more appropriate than a full reversal.
          </p>

          <h2 className="text-base font-semibold">
            12. Chargebacks and Payment Disputes
          </h2>
          <p>
            If a customer initiates a chargeback or payment dispute through
            their bank or payment provider, NexaMart may provide transaction
            records, order history, delivery evidence, and related
            communications to respond to that claim. Abuse of chargebacks may
            lead to account restrictions.
          </p>

          <h2 className="text-base font-semibold">13. Abuse Prevention</h2>
          <p>
            NexaMart reserves the right to reject refund or return requests that
            appear fraudulent, abusive, repetitive, or inconsistent with
            platform records.
          </p>

          <h2 className="text-base font-semibold">14. Contact</h2>
          <p>
            For refund, return, or dispute-related inquiries, contact:
            <br />
            <strong>support@shopnexamart.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
