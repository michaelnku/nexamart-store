export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-full flex items-center justify-center bg-gray-50 px-4 py-16 dark:bg-neutral-950">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-10">
        <h1 className="text--brand-blue text-center text-2xl font-semibold sm:text-3xl">
          Community Guidelines
        </h1>

        <p className="text-center text-sm text-muted-foreground">
          Last Updated: March 2026
        </p>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <h2 className="text-base font-semibold">1. Purpose</h2>
          <p>
            NexaMart is a marketplace built on trust between customers, sellers,
            and delivery partners. These Community Guidelines outline the
            expected behavior of everyone using the platform.
          </p>

          <h2 className="text-base font-semibold">
            2. Respectful Communication
          </h2>
          <p>
            Users must communicate respectfully when using messaging features,
            store questions, customer support, or any platform interaction.
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>No harassment, abuse, threats, or hate speech</li>
            <li>No spam or unsolicited promotional messages</li>
            <li>No impersonation of other users or businesses</li>
          </ul>

          <h2 className="text-base font-semibold">3. Honest Platform Use</h2>
          <p>Users must use NexaMart honestly and in good faith.</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>No fraudulent transactions or payment manipulation</li>
            <li>No false order claims or delivery abuse</li>
            <li>No attempts to bypass platform payments or fees</li>
          </ul>

          <h2 className="text-base font-semibold">4. Content Standards</h2>
          <p>
            Any content uploaded to NexaMart (product listings, store pages,
            images, or messages) must be lawful and appropriate.
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>No illegal or misleading content</li>
            <li>No harmful, abusive, or explicit material</li>
            <li>No copyright or trademark violations</li>
          </ul>

          <h2 className="text-base font-semibold">5. Platform Safety</h2>
          <p>
            Users must not attempt to disrupt or compromise the security or
            operation of NexaMart.
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>No hacking, probing, or exploiting platform systems</li>
            <li>No automated scraping or abusive bot activity</li>
            <li>No attempts to manipulate ratings, reviews, or transactions</li>
          </ul>

          <h2 className="text-base font-semibold">6. Enforcement</h2>
          <p>
            NexaMart may remove content, restrict features, suspend accounts, or
            take other actions where these guidelines are violated.
          </p>

          <h2 className="text-base font-semibold">7. Contact</h2>
          <p>
            For community or safety concerns, contact:
            <br />
            <strong>support@shopnexamart.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
