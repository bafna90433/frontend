import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import MainLayout from "../components/MainLayout"; // ✅ ensure correct path
import "../styles/ManageAddresses.css";

type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  label?: "Home" | "Office" | "Other";
  isDefault?: boolean;
};

type Mode = { type: "add" } | { type: "edit"; id: string };

const LOCAL_KEY = "bt.addresses";

function useApiOrLocal() {
  const get = async (): Promise<Address[]> => {
    try {
      const { data } = await api.get("/addresses");
      return data ?? [];
    } catch {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  };
  const post = async (addr: Address): Promise<Address> => {
    try {
      const { data } = await api.post("/addresses", addr);
      return data;
    } catch {
      const list = await get();
      const newAddr = { ...addr, _id: crypto.randomUUID() };
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...list, newAddr]));
      return newAddr;
    }
  };
  const put = async (id: string, addr: Address): Promise<Address> => {
    try {
      const { data } = await api.put(`/addresses/${id}`, addr);
      return data;
    } catch {
      const list = await get();
      const updated = list.map((a) => (a._id === id ? { ...a, ...addr } : a));
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated.find((a) => a._id === id)!;
    }
  };
  const del = async (id: string): Promise<void> => {
    try {
      await api.delete(`/addresses/${id}`);
    } catch {
      const list = await get();
      localStorage.setItem(
        LOCAL_KEY,
        JSON.stringify(list.filter((a) => a._id !== id))
      );
    }
  };
  return { get, post, put, del };
}

const empty: Address = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  label: "Home",
  isDefault: false,
};

const ManageAddresses: React.FC = () => {
  const { get, post, put, del } = useApiOrLocal();
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode | null>(null);
  const [form, setForm] = useState<Address>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await get();
      setItems(list);
      setLoading(false);
    })();
  }, []);

  const startAdd = () => {
    setForm(empty);
    setMode({ type: "add" });
  };

  const startEdit = (a: Address) => {
    setForm(a);
    setMode({ type: "edit", id: a._id! });
  };

  const closeSheet = () => {
    setMode(null);
    setForm(empty);
  };

  const setDefault = async (id: string) => {
    const next = items.map((a) => ({ ...a, isDefault: a._id === id }));
    setItems(next);
    await Promise.all(
      next.map((a) =>
        a._id ? put(a._id, { ...a, isDefault: a._id === id }) : Promise.resolve(a)
      )
    );
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await del(id);
    setItems((x) => x.filter((a) => a._id !== id));
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = (a: Address) => {
    const errs: string[] = [];
    if (!a.fullName.trim()) errs.push("Name required");
    if (!/^\d{10}$/.test(a.phone)) errs.push("10-digit phone required");
    if (!a.line1.trim()) errs.push("Address line 1 required");
    if (!a.city.trim()) errs.push("City required");
    if (!a.state.trim()) errs.push("State required");
    if (!/^\d{5,6}$/.test(a.zip)) errs.push("Valid ZIP required");
    return errs;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length) return alert(errs[0]);
    setSaving(true);
    try {
      if (mode?.type === "edit" && mode.id) {
        const updated = await put(mode.id, form);
        setItems((x) => x.map((a) => (a._id === mode.id ? updated : a)));
      } else {
        const created = await post(form);
        setItems((x) => [created, ...x]);
      }
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((a) =>
      [
        a.fullName,
        a.phone,
        a.line1,
        a.line2,
        a.city,
        a.state,
        a.zip,
        a.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  return (
    // ✅ Wrap everything in MainLayout so sidebar always shows
    <MainLayout>
      <div className="addr-page">
        <div className="addr-head">
          <h1>Manage addresses</h1>
          <button className="btn-primary" onClick={startAdd}>+ Add new</button>
        </div>

        <div className="addr-tools">
          <input
            className="search"
            placeholder="Search address, city, zip…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="addr-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="addr-empty">No addresses yet</div>
        ) : (
          <ul className="addr-list">
            {filtered.map((a) => (
              <li key={a._id} className={`addr-card ${a.isDefault ? "def" : ""}`}>
                <div className="addr-top">
                  <div className="addr-title">
                    <span className="badge">{a.label || "Other"}</span>
                    <strong>{a.fullName}</strong>
                  </div>
                  <div className="addr-actions">
                    {!a.isDefault && (
                      <button className="link" onClick={() => setDefault(a._id!)} title="Set as default">
                        Set default
                      </button>
                    )}
                    <button className="link" onClick={() => startEdit(a)}>Edit</button>
                    <button className="link danger" onClick={() => remove(a._id!)}>Delete</button>
                  </div>
                </div>

                <div className="addr-body">
                  <div className="addr-lines">
                    <span>{a.line1}</span>
                    {a.line2 ? <span>{a.line2}</span> : null}
                    <span>{a.city}, {a.state} {a.zip}</span>
                  </div>
                  <div className="addr-meta">
                    <span>📞 {a.phone}</span>
                    {a.isDefault && <span className="chip">Default</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {mode && (
          <div className="addr-sheet" role="dialog" aria-modal>
            <div className="sheet-card">
              <div className="sheet-head">
                <h2>{mode.type === "edit" ? "Edit address" : "Add address"}</h2>
                <button className="icon" onClick={closeSheet} aria-label="Close">✕</button>
              </div>

              <form className="sheet-form" onSubmit={save}>
                <div className="grid">
                  <label>
                    <span>Full name</span>
                    <input name="fullName" value={form.fullName} onChange={onChange} placeholder="e.g., Rishi Kumar" />
                  </label>

                  <label>
                    <span>Phone</span>
                    <input name="phone" inputMode="numeric" maxLength={10} value={form.phone} onChange={onChange} placeholder="10-digit mobile" />
                  </label>

                  <label className="col-2">
                    <span>Address line 1</span>
                    <input name="line1" value={form.line1} onChange={onChange} placeholder="Flat / house / building" />
                  </label>

                  <label className="col-2">
                    <span>Address line 2 (optional)</span>
                    <input name="line2" value={form.line2 || ""} onChange={onChange} placeholder="Area / landmark" />
                  </label>

                  <label>
                    <span>City</span>
                    <input name="city" value={form.city} onChange={onChange} placeholder="Coimbatore" />
                  </label>

                  <label>
                    <span>State</span>
                    <input name="state" value={form.state} onChange={onChange} placeholder="Tamil Nadu" />
                  </label>

                  <label>
                    <span>ZIP</span>
                    <input name="zip" inputMode="numeric" maxLength={6} value={form.zip} onChange={onChange} placeholder="641001" />
                  </label>

                  <label>
                    <span>Label</span>
                    <select name="label" value={form.label} onChange={onChange}>
                      <option>Home</option>
                      <option>Office</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label className="switch col-2">
                    <input type="checkbox" name="isDefault" checked={!!form.isDefault} onChange={onChange} />
                    <span>Set as default</span>
                  </label>
                </div>

                <div className="sheet-actions">
                  <button type="button" className="btn-ghost" onClick={closeSheet} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ManageAddresses;
