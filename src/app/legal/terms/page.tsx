export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 space-y-8">
      <h1 className="text-4xl font-black">Terms of Service</h1>
      <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using MineAI (“the Platform”), you agree to be bound by these Terms of Service.
          If you do not agree, you must not use the Platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">2. Eligibility</h2>
        <p>
          You must be at least 18 years old to use MineAI. By using this Platform, you confirm that you meet this requirement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">3. Description of Service</h2>
        <p>
          MineAI is an artificial intelligence platform that allows users to create characters,
          chat with AI personalities, and generate fictional conversations.
        </p>

        <p>
          AI responses are generated automatically and may sometimes be inaccurate, fictional,
          or unexpected. You agree not to rely on AI responses as professional advice.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">4. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account.</p>

        <p>
          You agree not to:
          <ul className="list-disc ml-6 mt-2">
            <li>Share accounts</li>
            <li>Impersonate others</li>
            <li>Use the platform for illegal purposes</li>
            <li>Attempt to hack or disrupt the service</li>
          </ul>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">5. User Content</h2>
        <p>
          You retain ownership of characters and content you create.
          However, by posting content on MineAI you grant us a license to host,
          display, and distribute that content within the platform.
        </p>

        <p>
          We reserve the right to remove any content that violates our policies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">6. AI Generated Content</h2>
        <p>
          AI characters are fictional. They are not real people and should not be treated as such.
        </p>

        <p>
          MineAI is not responsible for emotional, psychological, financial,
          or personal decisions made based on AI interactions.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">7. Subscriptions</h2>
        <p>
          Premium features are available via paid subscription.
          Pricing may change at any time with reasonable notice.
        </p>

        <p>
          Subscriptions automatically renew unless canceled before the renewal date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">9. Disclaimer</h2>
        <p>
          The Platform is provided “as is” without warranties of any kind.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">10. Limitation of Liability</h2>
        <p>
          MineAI shall not be liable for any indirect, incidental,
          or consequential damages resulting from the use of the Platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">11. Changes to Terms</h2>
        <p>
          We may update these Terms at any time. Continued use of the Platform constitutes acceptance.
        </p>
      </section>
    </div>
  );
}
