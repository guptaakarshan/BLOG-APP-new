import React from "react";

const LandingPage = ({ onStart }) => {
  const backgroundImageUrl =
    "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2069&auto=format&fit=crop";

  return (
    <div className="landing-page relative h-screen w-full overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white ring-1 ring-inset ring-white/20">
              Your voice matters
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tight text-white">
              Start your blog, share your story
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed text-slate-200">
              Write, publish, and grow an audience with a simple, elegant
              editor. No setup required — just your ideas.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-white text-base md:text-lg font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:ring-offset-slate-900 transition"
              >
                Start Writing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="relative z-10 py-4 text-center text-slate-300 text-sm">
        Made by Akarshan
      </footer>
    </div>
  );
};

export default LandingPage;
