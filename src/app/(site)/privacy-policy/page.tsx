export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-full flex items-center justify-center px-4 py-16 bg-gray-50 dark:bg-neutral-950">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-10">
        <h1 className="text-2xl text--brand-blue sm:text-3xl font-semibold text-center">
          Privacy Policy
        </h1>

        <p className="text-sm text-muted-foreground text-center">
          Last Updated: March 2026
        </p>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <h2 className="font-semibold text-base">1. Introduction</h2>
          <p>
            NexaMart ("we", "our", or "us") operates a digital marketplace that
            allows customers to purchase products and services from independent
            sellers. This Privacy Policy explains how we collect, use, and
            protect your information when you use our platform.
          </p>

          <h2 className="font-semibold text-base">2. Information We Collect</h2>
          <p>We may collect personal information including:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Delivery and billing addresses</li>
            <li>Account profile information</li>
          </ul>

          <h2 className="font-semibold text-base">3. Account Information</h2>
          <p>
            When you register on NexaMart, we may collect account-related data
            such as order history, store information for sellers, and delivery
            details for riders.
          </p>

          <h2 className="font-semibold text-base">4. Payment Information</h2>
          <p>
            Payments may be processed by third-party payment providers such as
            Stripe or other payment processors. NexaMart does not store full
            credit card details on its servers.
          </p>

          <h2 className="font-semibold text-base">
            5. Device and Technical Data
          </h2>
          <p>
            We may automatically collect technical information including IP
            address, device type, browser type, operating system, and platform
            usage statistics.
          </p>

          <h2 className="font-semibold text-base">
            6. Marketplace Data Sharing
          </h2>
          <p>
            NexaMart is a multi-vendor marketplace. When you place an order,
            your necessary information may be shared with sellers, delivery
            riders, and payment processors to complete the transaction.
          </p>

          <h2 className="font-semibold text-base">7. Identity Verification</h2>
          <p>
            Sellers and riders may be required to provide identity verification
            documents to ensure platform security and prevent fraud.
          </p>

          <h2 className="font-semibold text-base">8. Cookies</h2>
          <p>
            We use cookies and similar technologies to maintain login sessions,
            improve platform performance, and detect fraudulent activity.
          </p>

          <h2 className="font-semibold text-base">9. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security
            measures to protect user data. However, no method of transmission
            over the internet is completely secure.
          </p>

          <h2 className="font-semibold text-base">10. Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary to operate the
            platform, comply with legal obligations, and resolve disputes.
          </p>

          <h2 className="font-semibold text-base">11. User Rights</h2>
          <p>
            Users may request access, correction, or deletion of their personal
            information by contacting our support team.
          </p>

          <h2 className="font-semibold text-base">
            12. Changes to This Policy
          </h2>
          <p>
            NexaMart may update this Privacy Policy from time to time. Updates
            will be posted on this page with a revised date.
          </p>

          <h2 className="font-semibold text-base">13. Contact</h2>
          <p>
            For privacy-related inquiries, please contact:
            <br />
            <strong>support@shopnexamart.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
