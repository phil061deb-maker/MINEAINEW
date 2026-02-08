export default function ContentPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 space-y-8">
      <h1 className="text-4xl font-black">Content Policy</h1>

      <p>
        MineAI allows creative expression but prohibits harmful or illegal content.
      </p>

      <h2 className="text-2xl font-bold">Prohibited Content</h2>
      <ul className="list-disc ml-6">
        <li>Content involving minors in sexual contexts</li>
        <li>Real-world threats or violence</li>
        <li>Hate speech</li>
        <li>Illegal activities</li>
        <li>Non-consensual sexual content</li>
      </ul>

      <h2 className="text-2xl font-bold">NSFW Content</h2>
      <p>
        NSFW content is only permitted for users 18+ and must remain fictional.
      </p>

      <h2 className="text-2xl font-bold">Enforcement</h2>
      <p>
        We reserve the right to remove content and suspend accounts that violate this policy.
      </p>
    </div>
  );
}
