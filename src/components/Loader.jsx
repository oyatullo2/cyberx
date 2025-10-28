// src/components/Loader.jsx
export default function Loader() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-slate-950/70 backdrop-blur-sm z-[9999]">
      <div className="w-14 h-14 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin" />
    </div>
  );
}
