export default function DeliveryRiderTermsPage() {
  return (
    <main className="min-h-full flex items-center justify-center bg-gray-50 px-4 py-16 dark:bg-neutral-950">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-10">
        <h1 className="text--brand-blue text-center text-2xl font-semibold sm:text-3xl">
          Delivery & Rider Terms
        </h1>

        <p className="text-center text-sm text-muted-foreground">
          Last Updated: March 2026
        </p>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <h2 className="text-base font-semibold">1. Overview</h2>
          <p>
            These Delivery & Rider Terms govern the use of NexaMart delivery
            services and apply to riders, customers, and sellers to the extent
            relevant to order pickup, transportation, handoff, and delivery
            completion.
          </p>

          <h2 className="text-base font-semibold">
            2. Independent Rider Status
          </h2>
          <p>
            Riders using NexaMart are independent service providers unless
            otherwise expressly stated in writing. Nothing in these Terms
            creates an employment or agency relationship between NexaMart and
            any rider.
          </p>

          <h2 className="text-base font-semibold">3. Rider Eligibility</h2>
          <p>Riders may be required to provide and maintain:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Accurate personal and contact information</li>
            <li>Government-issued identification</li>
            <li>Vehicle or transport details where applicable</li>
            <li>
              Any licenses, permits, insurance, or certifications required by
              law
            </li>
          </ul>

          <h2 className="text-base font-semibold">
            4. Delivery Responsibilities
          </h2>
          <p>Riders are responsible for:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              Collecting the correct order from the correct seller or pickup
              point
            </li>
            <li>Transporting orders with reasonable care</li>
            <li>
              Maintaining professional conduct during pickups and deliveries
            </li>
            <li>
              Following required confirmation, OTP, or handoff procedures where
              enabled
            </li>
            <li>Marking delivery statuses truthfully and accurately</li>
          </ul>

          <h2 className="text-base font-semibold">
            5. Customer Responsibilities
          </h2>
          <p>Customers are responsible for:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              Providing accurate delivery details and reachable contact
              information
            </li>
            <li>Being reasonably available to receive an order</li>
            <li>
              Completing verification or confirmation steps where required
            </li>
            <li>Treating riders respectfully and lawfully</li>
          </ul>

          <h2 className="text-base font-semibold">
            6. Seller Responsibilities During Delivery
          </h2>
          <p>
            Sellers must prepare the correct order, package items appropriately,
            and make the order reasonably available for pickup. Sellers remain
            responsible for order accuracy prior to handoff.
          </p>

          <h2 className="text-base font-semibold">7. Delivery Fees</h2>
          <p>
            Delivery fees may be determined by factors such as location,
            distance, order type, service level, promotions, or marketplace
            rules. Fees shown at checkout or during assignment may be subject to
            updates where permitted by platform logic or policy.
          </p>

          <h2 className="text-base font-semibold">8. Failed Deliveries</h2>
          <p>
            A delivery may fail where the customer is unavailable, the address
            is inaccurate, the order cannot be safely completed, access is
            denied, or the delivery cannot proceed for operational reasons. In
            such cases, NexaMart may determine the appropriate next step,
            including return, retry, cancellation, or dispute review.
          </p>

          <h2 className="text-base font-semibold">
            9. Pickup and Handoff Verification
          </h2>
          <p>
            NexaMart may require pickup confirmation, delivery OTP verification,
            customer confirmation, proof of handoff, or other anti-fraud
            controls before an order is considered complete. Failure to follow
            required steps may affect payout or dispute decisions.
          </p>

          <h2 className="text-base font-semibold">
            10. Rider Earnings and Payouts
          </h2>
          <p>
            Rider earnings may include delivery fees or other platform-approved
            amounts. Payouts may be subject to settlement delays, fraud checks,
            customer confirmation windows, dispute periods, order completion
            validation, or account verification requirements before becoming
            available.
          </p>

          <h2 className="text-base font-semibold">11. Prohibited Conduct</h2>
          <p>The following are prohibited:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>False delivery completion or status manipulation</li>
            <li>Tampering with packages or delivery contents</li>
            <li>Harassment, threats, or abusive conduct</li>
            <li>Sharing customer information outside the delivery purpose</li>
            <li>
              Fraudulent collusion with customers, sellers, or other riders
            </li>
          </ul>

          <h2 className="text-base font-semibold">
            12. Disputes and Investigations
          </h2>
          <p>
            NexaMart may investigate reported delivery issues using order
            records, timestamps, rider actions, seller updates, customer
            reports, messaging data, OTP events, and other available evidence.
            Payouts may be held while reviews are ongoing.
          </p>

          <h2 className="text-base font-semibold">
            13. Suspension and Termination
          </h2>
          <p>
            NexaMart may suspend or terminate rider access for fraud, unsafe
            conduct, repeated service failures, refusal to comply with
            verification measures, manipulation of delivery status, or violation
            of any platform rule.
          </p>

          <h2 className="text-base font-semibold">
            14. Limitation of Liability
          </h2>
          <p>
            NexaMart is not responsible for rider vehicle loss, fuel costs,
            personal injury, operating expenses, taxes, fines, permit issues, or
            losses arising from a rider’s independent delivery activity, except
            as required by law.
          </p>

          <h2 className="text-base font-semibold">15. Contact</h2>
          <p>
            For delivery or rider policy inquiries, contact:
            <br />
            <strong>support@shopnexamart.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
