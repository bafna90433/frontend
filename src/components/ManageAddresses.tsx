// src/components/ManageAddresses.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; 
import api from "../utils/api";
import MainLayout from "../components/MainLayout";
import "../styles/ManageAddresses.css";
import { MapPin, Phone, Edit2, Trash2, CheckCircle, Plus } from "lucide-react";

// --- Types ---
type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  type: "Home" | "Office" | "Other";
  isDefault?: boolean;
};

type Mode = { type: "add" } | { type: "edit"; id: string };

const LOCAL_KEY = "bt.addresses";
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

// --- Parsing Logic for Registration Address ---
const parseRegisterAddress = (addrStr: string, user: any): Address | null => {
    if (!addrStr) return null;
    let street = "", area = "", city = "", state = "", pincode = "";
    const lines = addrStr.split('\n');
    lines.forEach(line => {
        const [key, ...valParts] = line.split(':');
        const val = valParts.join(':').trim();
        if (!key || !val) return;
        const k = key.trim().toLowerCase();
        if (k === 'address' || k === 'street') street = val;
        else if (k === 'area') area = val !== 'N/A' ? val : "";
        else if (k === 'city') city = val;
        else if (k === 'state') state = val;
        else if (k.includes('pin')) pincode = val;
    });
    if (!street && !city) street = addrStr;
    return {
        fullName: user?.shopName || "My Shop",
        phone: user?.otpMobile || "",
        street, area, city, state, pincode,
        type: "Home",
        isDefault: true
    };
};

// --- API Helpers ---
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
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list.filter((a) => a._id !== id)));
    }
  };
  return { get, post, put, del };
}

const empty: Address = {
  fullName: "", phone: "", street: "", area: "", city: "", state: "", pincode: "", type: "Home", isDefault: false,
};

const ManageAddresses: React.FC = () => {
  const { get, post, put, del } = useApiOrLocal();
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode | null>(null);
  const [form, setForm] = useState<Address>(empty);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSelectMode = searchParams.get("select") === "true";
  const redirectTarget = searchParams.get("redirect");

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      let list = await get();

      // Agar addresses list empty hai, to Register wala address fetch karo
      if (list.length === 0 && currentUser?.address) {
          const regAddr = parseRegisterAddress(currentUser.address, currentUser);
          if (regAddr) {
              const saved = await post(regAddr); 
              list = [saved];
          }
      }
      setItems(list);
      setLoading(false);

      // Agar checkout se redirect hokar aaye hain to Add Modal open karo
      if (redirectTarget === "checkout") {
          startAdd();
      }
    })();
  }, [redirectTarget]);

  const selectAddressForCheckout = (addr: Address) => {
      localStorage.setItem("temp_checkout_address", JSON.stringify(addr));
      navigate("/checkout");
  };

  const startAdd = () => {
    setForm({ ...empty, fullName: currentUser?.shopName || "", phone: currentUser?.otpMobile || "" });
    setMode({ type: "add" });
  };

  const startEdit = (a: Address) => {
    setForm(a);
    setMode({ type: "edit", id: a._id! });
  };

  const closeSheet = () => {
    setMode(null);
    setForm(empty);
    if (redirectTarget === "checkout") navigate("/checkout");
  };

  const setDefault = async (id: string) => {
    const next = items.map((a) => ({ ...a, isDefault: a._id === id }));
    setItems(next);
    await Promise.all(next.map((a) => a._id ? put(a._id, { ...a, isDefault: a._id === id }) : Promise.resolve(a)));
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    await del(id);
    setItems((x) => x.filter((a) => a._id !== id));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    if ((name === "phone" || name === "pincode") && !/^\d*$/.test(value)) return;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let savedAddr;
      if (mode?.type === "edit" && mode.id) {
        savedAddr = await put(mode.id, form);
        setItems((x) => x.map((a) => (a._id === mode.id ? savedAddr : a)));
      } else {
        savedAddr = await post({ ...form, isDefault: items.length === 0 });
        setItems((x) => [savedAddr, ...x]);
      }
      closeSheet();
      if (isSelectMode || redirectTarget === "checkout") {
          selectAddressForCheckout(savedAddr);
      }
    } catch (e) {
      alert("Error saving address");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((a) => [a.fullName, a.phone, a.street, a.city, a.pincode].join(" ").toLowerCase().includes(q));
  }, [items, search]);

  return (
    <MainLayout>
      <div className="addr-page">
        <div className="addr-head">
          <div>
            <h1>{isSelectMode ? "Select Delivery Address" : "My Addresses"}</h1>
            <p className="addr-subtitle">Manage your shipping destinations</p>
          </div>
          <button className="btn-primary" onClick={startAdd}><Plus size={18} /> Add New</button>
        </div>

        <div className="addr-tools">
          <input className="search" placeholder="Search address..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="addr-empty"><div className="loader"></div></div>
        ) : filtered.length === 0 ? (
          <div className="addr-empty"><MapPin size={48} color="#cbd5e1" /><p>No addresses found.</p></div>
        ) : (
          <ul className="addr-list">
            {filtered.map((a) => (
              <li key={a._id} className={`addr-card ${a.isDefault ? "def" : ""}`}>
                <div className="addr-content">
                  <div className="addr-header">
                    <span className={`badge ${a.type.toLowerCase()}`}>{a.type}</span>
                    {a.isDefault && <span className="default-tag"><CheckCircle size={12}/> Default</span>}
                  </div>
                  <h3 className="addr-name">{a.fullName}</h3>
                  <p className="addr-text">{a.street}, {a.area}</p>
                  <p className="addr-text">{a.city}, {a.state} - <strong>{a.pincode}</strong></p>
                  <p className="addr-phone"><Phone size={14} /> {a.phone}</p>
                </div>

                <div className="addr-actions" style={{justifyContent: isSelectMode ? 'space-between' : 'flex-end'}}>
                  {isSelectMode ? (
                      <button className="deliver-btn" onClick={() => selectAddressForCheckout(a)}>Deliver Here</button>
                  ) : (
                      !a.isDefault && <button className="action-link" onClick={() => setDefault(a._id!)}>Set Default</button>
                  )}
                  <div className="icon-actions">
                    <button className="icon-btn edit" onClick={() => startEdit(a)}><Edit2 size={16} /></button>
                    {!isSelectMode && <button className="icon-btn delete" onClick={() => remove(a._id!)}><Trash2 size={16} /></button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {mode && (
          <div className="addr-sheet-overlay">
            <div className="sheet-card">
              <div className="sheet-head">
                <h2>{mode.type === "edit" ? "Edit Address" : "Add New Address"}</h2>
                <button className="close-btn" onClick={closeSheet}>✕</button>
              </div>
              <form className="sheet-form" onSubmit={save}>
                <div className="form-scroll">
                    <div className="grid">
                        <label><span>Full Name *</span><input name="fullName" value={form.fullName} onChange={onChange} required /></label>
                        <label><span>Phone *</span><input name="phone" maxLength={10} value={form.phone} onChange={onChange} required /></label>
                        <label className="col-2"><span>Street / Shop No. *</span><input name="street" value={form.street} onChange={onChange} required /></label>
                        <label className="col-2"><span>Area / Landmark</span><input name="area" value={form.area || ""} onChange={onChange} /></label>
                        <label><span>City *</span><input name="city" value={form.city} onChange={onChange} required /></label>
                        <label><span>Pincode *</span><input name="pincode" maxLength={6} value={form.pincode} onChange={onChange} required /></label>
                        <label className="col-2"><span>State *</span>
                            <select name="state" value={form.state} onChange={onChange} required style={{width:'100%',padding:'10px',border:'1px solid #cbd5e1',borderRadius:'8px'}}>
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                        </label>
                        <label><span>Type</span><select name="type" value={form.type} onChange={onChange}><option>Home</option><option>Office</option><option>Other</option></select></label>
                        <label className="switch col-2"><input type="checkbox" name="isDefault" checked={!!form.isDefault} onChange={onChange} /><span className="slider"></span><span className="label-text">Set as default</span></label>
                    </div>
                </div>
                <div className="sheet-actions">
                  <button type="button" className="btn-ghost" onClick={closeSheet}>Cancel</button>
                  <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Address"}</button>
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