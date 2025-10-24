export default function TypingDots() {
  return (
    <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[ping_1s_ease-in-out_infinite]"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150"></span>
    </div>
  );
}
