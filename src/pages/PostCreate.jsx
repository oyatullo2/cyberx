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
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(e) {
    const files = Array.from(e.target.files || e.dataTransfer.files);
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
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold text-indigo-400 mb-5">Yangi post</h1>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sarlavha (ixtiyoriy)"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Bugun nimani o‘yladingiz?"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
        />

        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Rasmlar (bir nechta tanlasa bo‘ladi)
          </label>

          {/* File input + DragDrop */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`rounded-xl border-2 ${
              dragOver
                ? "border-indigo-600 bg-slate-900/70"
                : "border-slate-700 bg-slate-950/70"
            } text-sm text-slate-300 px-3 py-4 text-center cursor-pointer`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="block cursor-pointer">
              📁 Fayllarni tanlang yoki bu joyga tashlang
            </label>
          </div>

          {/* Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
              {images.map((file, i) => (
                <div
                  key={i}
                  className="relative rounded-xl border border-slate-700 overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="object-cover w-full aspect-square"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
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
            className="rounded-xl px-4 py-2 text-sm font-semibold border border-indigo-700/60 bg-slate-900 text-indigo-200"
          >
            {busy ? "Yuborilmoqda…" : "Post qilish"}
          </button>

          <button
            type="button"
            onClick={() => nav(-1)}
            className="rounded-xl px-4 py-2 text-sm border border-slate-700 text-slate-200"
          >
            Bekor qilish
          </button>
        </div>
      </form>
    </div>
  );
}
