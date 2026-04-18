import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6">AI Study Planner</h1>

        <p className="text-lg text-slate-300 mb-8">
          Organize your tasks, track deadlines, and generate a simple AI-powered
          study plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
          >
            Get Started
          </Link>

          <Link
            href="/dashboard"
            className="border border-slate-600 hover:border-slate-400 px-6 py-3 rounded-lg font-medium"
          >
            Learn More
          </Link>
        </div>
      </div>
    </main>
  );
}