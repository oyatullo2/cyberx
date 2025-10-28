export default function Help() {
  const faqs = [
    {
      q: "Parolni unutdim, nima qilay?",
      a: "Login sahifasidagi “Forgot password” → emailingizni kiriting → kodni tasdiqlang → yangi parol o‘rnating.",
    },
    {
      q: "Email tasdiqlash xati kelmadi",
      a: "Spam/Promotions papkalarini tekshiring. Zarur bo‘lsa Dashboard’dagi “Emailni tasdiqlash” tugmasidan qayta yuboring.",
    },
    {
      q: "Xabarlar kechikmoqda",
      a: "Internet tezligini tekshiring (Dashboard’da real-time speed mavjud). Brauzer kechigishi bo‘lsa sahifani yangilang.",
    },
    {
      q: "Akkount xavfsizligi",
      a: "Kuchli parol va alohida emaildan foydalaning. Bir nechta qurilmada ishlatsangiz vaqti-vaqti bilan sessiyalarni tekshiring.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-extrabold mb-4">Yordam / FAQ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-indigo-600 transition"
          >
            <div className="font-bold">{f.q}</div>
            <div className="text-sm text-slate-400 mt-1">{f.a}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="font-bold mb-2">Foydali havolalar</div>
        <ul className="text-sm list-disc pl-5 text-slate-400 space-y-1">
          <a href="/settings"><li>Profil sozlamalari: parol va emailni yangilash</li></a>
          <a href="/dashboard"><li>Dashboard: internet tezligi va tizim holati</li></a>
          <a href="/users"><li>Users: foydalanuvchilarni ko‘rish</li></a>
          <a href="/messages"><li>Messages: real-time chat</li></a>
        </ul>
      </div>
    </div>
  );
}
