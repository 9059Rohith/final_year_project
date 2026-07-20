import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-calm-bg flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-5xl font-bold text-warm-700 mb-3">மித்ரா</h1>
        <h2 className="text-2xl font-semibold text-stone-700 mb-2">Mitra</h2>
        <p className="text-lg text-stone-500 max-w-md mx-auto">
          Tamil Speech Companion for children with ASD.
          Learn Tamil words with your friendly AI companion!
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/login"
          className="bg-warm-500 hover:bg-warm-600 text-white text-center py-4 px-8 rounded-2xl text-xl font-semibold shadow-warm transition-all"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-white border-2 border-warm-300 hover:border-warm-500 text-warm-700 text-center py-4 px-8 rounded-2xl text-xl font-semibold transition-all"
        >
          Register
        </Link>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
        {[
          { emoji: "🎙️", title: "Speech Practice", desc: "Practice Tamil words with real-time mimicry" },
          { emoji: "🏆", title: "Track Progress", desc: "See scores and improvement over time" },
          { emoji: "👨‍⚕️", title: "Therapist Support", desc: "Guided programs from speech therapists" },
        ].map((f) => (
          <div key={f.title} className="card-warm text-center">
            <div className="text-4xl mb-3">{f.emoji}</div>
            <h3 className="font-bold text-lg text-warm-700 mb-1">{f.title}</h3>
            <p className="text-stone-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-stone-400 text-sm">
        Demo: parent@mitra.app / Parent@123
      </p>
    </main>
  );
}
