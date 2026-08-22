import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppHeader } from "@/components/AppHeader";
import { marketplaceApi } from "@/features/marketplace/api";
import { cropsApi } from "@/features/crops/api";
import { colorForCrop } from "@/features/plans/colors";
import type {
  Crop,
  ExchangeType,
  MarketplaceListing,
  MarketplaceListingCreate,
} from "@/types";

type Tab = "browse" | "selling" | "buying";

const OTHER = "__other__";

function ExchangeBadge({ listing }: { listing: MarketplaceListing }) {
  const { exchange_type, price_per_unit, unit } = listing;
  const text =
    exchange_type === "sell"
      ? `$${price_per_unit ?? "?"}${unit ? `/${unit}` : ""}`
      : exchange_type === "trade"
        ? "Trade"
        : "Free";
  const tone =
    exchange_type === "sell"
      ? "bg-sprout-600 text-white"
      : exchange_type === "trade"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {text}
    </span>
  );
}

function CropDot({ listing }: { listing: MarketplaceListing }) {
  return (
    <span
      className="h-3 w-3 shrink-0 rounded"
      style={{ backgroundColor: colorForCrop(listing.crop_id ?? listing.title) }}
    />
  );
}

export function Marketplace() {
  const [tab, setTab] = useState<Tab>("browse");
  const [crops, setCrops] = useState<Crop[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cropsApi.list().then(setCrops).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Marketplace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sell or share your extra harvest, and find produce from other growers
          near you.
        </p>

        <div className="mt-5 flex gap-2">
          {(["browse", "selling", "buying"] as Tab[]).map((t) => (
            <button
              key={t}
              className={
                tab === t
                  ? "btn bg-sprout-600 text-white"
                  : "btn border border-slate-200 text-slate-600 hover:bg-slate-50"
              }
              onClick={() => setTab(t)}
            >
              {t === "browse"
                ? "Browse"
                : t === "selling"
                  ? "My listings"
                  : "Reserved"}
            </button>
          ))}
        </div>

        {error && (
          <div className="card mt-4 border-amber-200 bg-amber-50 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="mt-6">
          {tab === "browse" && <BrowseTab crops={crops} onError={setError} />}
          {tab === "selling" && <SellingTab crops={crops} onError={setError} />}
          {tab === "buying" && <BuyingTab onError={setError} />}
        </div>
      </main>
    </div>
  );
}

function BrowseTab({
  crops,
  onError,
}: {
  crops: Crop[];
  onError: (m: string | null) => void;
}) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [cropId, setCropId] = useState("");
  const [city, setCity] = useState("");
  const [exchange, setExchange] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    onError(null);
    marketplaceApi
      .browse({
        crop_id: cropId || undefined,
        city: city || undefined,
        exchange_type: exchange || undefined,
      })
      .then(setListings)
      .catch((e) =>
        onError(e instanceof Error ? e.message : "Could not load listings.")
      );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [cropId, exchange]);

  const reserve = async (id: string) => {
    setBusyId(id);
    onError(null);
    try {
      await marketplaceApi.reserve(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not reserve.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="label">Crop</span>
          <select
            className="input"
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
          >
            <option value="">All crops</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="label">City</span>
          <input
            className="input"
            placeholder="e.g. Portland"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </label>
        <label className="text-sm">
          <span className="label">Type</span>
          <select
            className="input"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
          >
            <option value="">Any</option>
            <option value="sell">For sale</option>
            <option value="trade">Trade</option>
            <option value="free">Free</option>
          </select>
        </label>
        <button className="btn-secondary" onClick={load}>
          Apply
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="card text-sm text-slate-500">
          No listings match. Try clearing the filters, or be the first to list
          under "My listings".
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div key={l.id} className="card flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CropDot listing={l} />
                  <h3 className="font-semibold text-slate-900">{l.title}</h3>
                </div>
                <ExchangeBadge listing={l} />
              </div>
              <p className="text-sm text-slate-500">
                {[l.quantity ? `${l.quantity}${l.unit ?? ""}` : null, l.city]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              {l.description && (
                <p className="text-sm text-slate-600">{l.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {l.seller_name ?? "A neighbor"}
                {l.seller_city ? ` · ${l.seller_city}` : ""}
              </p>
              <button
                className="btn-primary mt-2"
                disabled={busyId === l.id}
                onClick={() => reserve(l.id)}
              >
                {busyId === l.id ? "Reserving…" : "Reserve"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SellingTab({
  crops,
  onError,
}: {
  crops: Crop[];
  onError: (m: string | null) => void;
}) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () =>
    marketplaceApi
      .mine()
      .then(setListings)
      .catch((e) =>
        onError(e instanceof Error ? e.message : "Could not load your listings.")
      );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    try {
      await marketplaceApi.remove(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <CreateListingForm crops={crops} onCreated={load} onError={onError} />

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Your listings</h2>
        {listings.length === 0 ? (
          <div className="card text-sm text-slate-500">
            Nothing listed yet. Add a listing on the left.
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CropDot listing={l} />
                    <h3 className="truncate font-semibold text-slate-900">
                      {l.title}
                    </h3>
                    <ExchangeBadge listing={l} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {l.status === "reserved"
                      ? `Reserved${l.reserved_by_name ? ` by ${l.reserved_by_name}` : ""}`
                      : l.status}
                    {l.city ? ` · ${l.city}` : ""}
                  </p>
                </div>
                <button
                  className={
                    confirmId === l.id
                      ? "btn bg-red-600 text-white hover:bg-red-700"
                      : "btn border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
                  }
                  onClick={() => remove(l.id)}
                  onBlur={() => setConfirmId((c) => (c === l.id ? null : c))}
                >
                  {confirmId === l.id ? "Really delete?" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateListingForm({
  crops,
  onCreated,
  onError,
}: {
  crops: Crop[];
  onCreated: () => void;
  onError: (m: string | null) => void;
}) {
  const [cropChoice, setCropChoice] = useState("");
  const [otherName, setOtherName] = useState("");
  const [exchange, setExchange] = useState<ExchangeType>("sell");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCrop = useMemo(
    () => crops.find((c) => c.id === cropChoice),
    [crops, cropChoice]
  );

  // Suggest the crop's typical price when selling a curated crop.
  useEffect(() => {
    if (exchange === "sell" && selectedCrop && !price) {
      setPrice(String(selectedCrop.estimated_price_per_kg));
    }
  }, [exchange, selectedCrop, price]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    onError(null);
    const title =
      cropChoice === OTHER ? otherName.trim() : selectedCrop?.name ?? "";
    if (!title) {
      onError("Pick a crop or enter a name.");
      return;
    }
    const body: MarketplaceListingCreate = {
      crop_id: cropChoice === OTHER || !cropChoice ? null : cropChoice,
      title,
      exchange_type: exchange,
      price_per_unit: exchange === "sell" ? Number(price) || 0 : null,
      quantity: quantity ? Number(quantity) : null,
      unit: unit || null,
      city: city || null,
      description: description || null,
    };
    setSubmitting(true);
    try {
      await marketplaceApi.create(body);
      setCropChoice("");
      setOtherName("");
      setPrice("");
      setQuantity("");
      setDescription("");
      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card h-fit space-y-3">
      <h2 className="font-semibold text-slate-900">List surplus produce</h2>

      <div>
        <label className="label" htmlFor="crop">
          Crop
        </label>
        <select
          id="crop"
          className="input"
          value={cropChoice}
          onChange={(e) => setCropChoice(e.target.value)}
        >
          <option value="">Select a crop…</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={OTHER}>Other…</option>
        </select>
      </div>

      {cropChoice === OTHER && (
        <div>
          <label className="label" htmlFor="other">
            Name
          </label>
          <input
            id="other"
            className="input"
            placeholder="e.g. Rhubarb"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="exchange">
          Offer
        </label>
        <select
          id="exchange"
          className="input"
          value={exchange}
          onChange={(e) => setExchange(e.target.value as ExchangeType)}
        >
          <option value="sell">Sell for a price</option>
          <option value="trade">Trade</option>
          <option value="free">Give away free</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exchange === "sell" && (
          <div>
            <label className="label" htmlFor="price">
              Price
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="qty">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min="0"
            step="0.1"
            className="input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="unit">
            Unit
          </label>
          <input
            id="unit"
            className="input"
            placeholder="kg, bunch, each"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="city">
          City
        </label>
        <input
          id="city"
          className="input"
          placeholder="Defaults to your profile city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="desc">
          Notes
        </label>
        <textarea
          id="desc"
          className="input"
          rows={2}
          placeholder="Freshly picked; trade for tomatoes…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Listing…" : "Publish listing"}
      </button>
    </form>
  );
}

function BuyingTab({ onError }: { onError: (m: string | null) => void }) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    marketplaceApi
      .reserved()
      .then(setListings)
      .catch((e) =>
        onError(e instanceof Error ? e.message : "Could not load reservations.")
      );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = async (id: string) => {
    setBusyId(id);
    onError(null);
    try {
      await marketplaceApi.cancelReserve(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setBusyId(null);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="card text-sm text-slate-500">
        You haven't reserved anything yet. Find produce under "Browse".
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <div key={l.id} className="card flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CropDot listing={l} />
              <h3 className="font-semibold text-slate-900">{l.title}</h3>
            </div>
            <ExchangeBadge listing={l} />
          </div>
          <p className="text-sm text-slate-500">
            From {l.seller_name ?? "a neighbor"}
            {l.seller_city ? ` · ${l.seller_city}` : ""}
          </p>
          <p className="text-xs text-sprout-700">
            Reserved — reach out to arrange the handoff.
          </p>
          <button
            className="btn-secondary mt-1"
            disabled={busyId === l.id}
            onClick={() => cancel(l.id)}
          >
            {busyId === l.id ? "Cancelling…" : "Cancel reservation"}
          </button>
        </div>
      ))}
    </div>
  );
}
