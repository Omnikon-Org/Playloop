export default function CreatePage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <h1 className="text-3xl font-black mb-3">Creator Studio</h1>
      <p className="text-white/60 mb-8 max-w-xs">
        Build your own HTML5 canvas games and publish them directly to the feed. SDK and upload portal coming soon.
      </p>
      <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform">
        Join the Waitlist
      </button>
    </div>
  );
}
