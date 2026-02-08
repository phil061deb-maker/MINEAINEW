export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 space-y-8">
      <h1 className="text-4xl font-black">Privacy Policy</h1>
      <p className="text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        MineAI respects your privacy and is committed to protecting your data.
      </p>

      <h2 className="text-2xl font-bold">Information We Collect</h2>
      <ul className="list-disc ml-6">
        <li>Email address</li>
        <li>Account information</li>
        <li>Characters you create</li>
        <li>Chat messages</li>
        <li>Usage analytics</li>
      </ul>

      <h2 className="text-2xl font-bold">How We Use Your Data</h2>
      <ul className="list-disc ml-6">
        <li>Provide platform functionality</li>
        <li>Improve AI systems</li>
        <li>Maintain security</li>
        <li>Process payments</li>
      </ul>

      <h2 className="text-2xl font-bold">Data Security</h2>
      <p>
        We implement industry-standard security practices, but no system is 100% secure.
      </p>

      <h2 className="text-2xl font-bold">Third Parties</h2>
      <p>
        We may use trusted third-party providers such as payment processors and hosting services.
      </p>

      <h2 className="text-2xl font-bold">Your Rights</h2>
      <p>
        You may request deletion of your account and data at any time.
      </p>

      <h2 className="text-2xl font-bold">Policy Updates</h2>
      <p>
        We may update this policy periodically.
      </p>
    </div>
  );
}
