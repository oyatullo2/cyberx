export default function Button({
  children,
  onClick,
  type = "button",
  disabled,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-3 font-semibold shadow-lg"
    >
      {children}
    </button>
  );
}
