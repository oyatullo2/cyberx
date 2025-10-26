import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function PostCreate() {
  const nav = useNavigate();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  }

  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!body.trim() && images.length === 0) {
      setErr("Post uchun matn yoki rasm kerak.");
      return;
    }
    setBusy(true);

    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("body", body.trim());
      images.forEach((img) => form.append("images[]", img));

      await api("post_create.php", {
        method: "POST",
        token,
        formData: true,
        body: form,
      });

      nav("/dashboard", { replace: true });
    } catch (e) {
      setErr(e.message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-indigo-400 mb-4">
        📸 Yangi post
      </h1>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sarlavha (ixtiyoriy)"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Bugun nimani o‘yladingiz?"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
        />

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Rasm (bir nechta tanlasa bo‘ladi)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="text-slate-300 text-sm"
          />

          {/* Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((file, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="rounded-xl border border-slate-700 w-full aspect-square object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {err && (
          <div className="text-sm text-rose-300 border border-rose-700/50 bg-rose-900/20 rounded-xl px-3 py-2">
            {err}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            disabled={busy}
            className="rounded-xl px-4 py-2 text-sm font-semibold border border-indigo-700/60 hover:bg-indigo-800/30 text-indigo-200 transition"
          >
            {busy ? "Yuborilmoqda…" : "Post qilish"}
          </button>
          <button
            type="button"
            onClick={() => nav(-1)}
            className="rounded-xl px-4 py-2 text-sm border border-slate-700 hover:bg-slate-800/40 text-slate-200 transition"
          >
            Bekor qilish
          </button>
        </div>
      </form>
    </div>
  );
}
