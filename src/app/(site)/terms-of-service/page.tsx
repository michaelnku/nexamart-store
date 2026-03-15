export default function TermsOfServicePage() {
  return (
    <main className="min-h-full flex items-center justify-center px-4 py-16 bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-10">
        <h1 className="text-2xl text--brand-blue sm:text-3xl font-semibold text-center">
          Terms of Service
        </h1>

        <p className="text-sm text-muted-foreground text-center">
          Last Updated: March 2026
        </p>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <h2 className="font-semibold text-base">1. Acceptance of Terms</h2>
          <p>
            By accessing or using NexaMart, you agree to be bound by these Terms
            of Service. If you do not agree with these terms, you may not use
            the platform.
          </p>

          <h2 className="font-semibold text-base">2. Platform Description</h2>
          <p>
            NexaMart is a multi-vendor marketplace that allows customers to
            purchase products and services from independent sellers. Delivery
            services may be provided by independent riders.
          </p>

          <h2 className="font-semibold text-base">3. User Accounts</h2>
          <p>
            Users must create an account to access certain features. You agree
            to provide accurate information and maintain the confidentiality of
            your login credentials.
          </p>

          <h2 className="font-semibold text-base">
            4. Marketplace Transactions
          </h2>
          <p>
            NexaMart facilitates transactions between buyers and sellers but
            does not directly sell products listed by sellers on the platform.
          </p>

          <h2 className="font-semibold text-base">5. Payments</h2>
          <p>
            Payments may be processed through third-party providers. NexaMart
            may provide wallet functionality for storing balances and processing
            payouts.
          </p>

          <h2 className="font-semibold text-base">6. Order Fulfillment</h2>
          <p>
            Sellers are responsible for product accuracy, quality, and
            fulfillment of orders. Riders are responsible for completing
            assigned deliveries.
          </p>

          <h2 className="font-semibold text-base">7. Order Cancellation</h2>
          <p>
            Orders may be cancelled due to payment failure, seller
            unavailability, or violation of platform policies. Refunds may be
            issued depending on the stage of the order.
          </p>

          <h2 className="font-semibold text-base">8. Disputes</h2>
          <p>
            Users may raise disputes for incorrect orders, delivery issues, or
            product concerns. NexaMart may review disputes and determine
            appropriate resolutions.
          </p>

          <h2 className="font-semibold text-base">9. Prohibited Activities</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Fraud or deceptive activity</li>
            <li>Harassment of other users</li>
            <li>Bypassing platform payment systems</li>
            <li>Abuse of messaging or reporting tools</li>
          </ul>

          <h2 className="font-semibold text-base">10. Platform Fees</h2>
          <p>
            NexaMart may charge service fees, delivery fees, or seller
            commissions for transactions conducted on the platform.
          </p>

          <h2 className="font-semibold text-base">11. Account Suspension</h2>
          <p>
            NexaMart reserves the right to suspend or terminate accounts that
            violate these Terms or pose security risks.
          </p>

          <h2 className="font-semibold text-base">
            12. Limitation of Liability
          </h2>
          <p>
            NexaMart is not liable for seller product defects, delivery delays,
            or third-party payment failures.
          </p>

          <h2 className="font-semibold text-base">13. Changes to Terms</h2>
          <p>
            These Terms may be updated periodically. Continued use of the
            platform indicates acceptance of the updated terms.
          </p>

          <h2 className="font-semibold text-base">14. Contact</h2>
          <p>
            For legal inquiries:
            <br />
            <strong>support@shopnexamart.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
