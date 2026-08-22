import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { gardensApi } from "@/features/gardens/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import type { SunlightLevel } from "@/types";

const SUNLIGHT_OPTIONS: { value: SunlightLevel; label: string; hint: string }[] =
  [
    { value: "full_sun", label: "Full sun", hint: "6+ hours direct sun" },
    { value: "partial_sun", label: "Partial sun", hint: "3–6 hours" },
    { value: "shade", label: "Shade", hint: "under 3 hours" },
  ];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function Wizard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [widthM, setWidthM] = useState("3");
  const [lengthM, setLengthM] = useState("2");
  const [sunlight, setSunlight] = useState<SunlightLevel>("full_sun");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return setImageFile(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      return setError("Image must be JPEG, PNG, or WebP.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return setError("Image must be 10 MB or smaller.");
    }
    setImageFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const garden = await gardensApi.create({
        name,
        city,
        width_m: Number(widthM),
        length_m: Number(lengthM),
        sunlight_level: sunlight,
      });

      if (imageFile && user) {
        const path = `${user.id}/${garden.id}/original.${imageFile.name
          .split(".")
          .pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("garden-images")
          .upload(path, imageFile, { upsert: true });
        if (uploadError) {
          console.warn("[sprout] image upload failed:", uploadError.message);
        } else {
          // Persist the storage path so the backend can hand the photo to
          // World Labs when generating the 3D preview.
          await gardensApi.update(garden.id, { image_path: path }).catch(() => {});
        }
      }

      navigate(`/gardens/${garden.id}/crops`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create garden (is the backend running?)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Create a garden</h1>
        <p className="mt-1 text-sm text-slate-500">Step {step} of 3</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {step === 1 && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-900">Basics</h2>
              <div>
                <label className="label" htmlFor="name">
                  Garden name
                </label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Backyard bed"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Portland, OR"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!name}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-900">
                Dimensions & sunlight
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="width">
                    Width (m)
                  </label>
                  <input
                    id="width"
                    type="number"
                    step="0.1"
                    min="0.5"
                    className="input"
                    value={widthM}
                    onChange={(e) => setWidthM(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="length">
                    Length (m)
                  </label>
                  <input
                    id="length"
                    type="number"
                    step="0.1"
                    min="0.5"
                    className="input"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <span className="label">Sunlight level</span>
                <div className="grid grid-cols-3 gap-2">
                  {SUNLIGHT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setSunlight(opt.value)}
                      className={`rounded-lg border p-3 text-left text-sm transition ${
                        sunlight === opt.value
                          ? "border-sprout-500 bg-sprout-50"
                          : "border-slate-200 bg-white hover:border-sprout-300"
                      }`}
                    >
                      <span className="block font-semibold text-slate-900">
                        {opt.label}
                      </span>
                      <span className="text-xs text-slate-500">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep(3)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-900">Garden photo</h2>
              <p className="text-sm text-slate-500">
                Optional. Used for the 3D preview. JPEG, PNG, or WebP up to 10 MB.
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sprout-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sprout-700"
              />
              {imageFile && (
                <p className="text-sm text-slate-600">Selected: {imageFile.name}</p>
              )}
              <div className="flex justify-between">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating…" : "Create & pick crops"}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    </div>
  );
}
