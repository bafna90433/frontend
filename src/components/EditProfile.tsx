import React, {
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
  FormEvent,
  DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import MainLayout from "../components/MainLayout"; // ✅ add this
import "../styles/EditProfile.css";

interface User {
  _id: string;
  firmName: string;
  shopName: string;
  state: string;
  city: string;
  zip: string;
  otpMobile: string;
  whatsapp: string;
  visitingCardUrl?: string;
}

type Form = Partial<User>;
type Errors = Partial<Record<keyof Form, string>>;

const MAX_FILE_MB = 5;
const ACCEPT_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const EditProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Form>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [visitingCardFile, setVisitingCardFile] = useState<File | null>(null);
  const [visitingCardPreview, setVisitingCardPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    try {
      const parsed: User = JSON.parse(stored);
      setUser(parsed);
      setForm({
        firmName: parsed.firmName ?? "",
        shopName: parsed.shopName ?? "",
        state: parsed.state ?? "",
        city: parsed.city ?? "",
        zip: parsed.zip ?? "",
        otpMobile: parsed.otpMobile ?? "",
        whatsapp: parsed.whatsapp ?? "",
        visitingCardUrl: parsed.visitingCardUrl ?? "",
      });
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (f: Form): Errors => {
    const next: Errors = {};
    if (!f.firmName?.trim()) next.firmName = "Firm name is required";
    if (!f.shopName?.trim()) next.shopName = "Shop name is required";
    if (!f.state?.trim()) next.state = "State is required";
    if (!f.city?.trim()) next.city = "City is required";
    if (!f.zip?.trim()) next.zip = "ZIP is required";
    if (f.zip && !/^\d{5,6}$/.test(f.zip)) next.zip = "Enter 5–6 digit ZIP";
    if (!f.otpMobile?.trim()) next.otpMobile = "Mobile is required";
    if (f.otpMobile && !/^\d{10}$/.test(f.otpMobile)) next.otpMobile = "Enter 10 digit mobile";
    if (f.whatsapp && !/^\d{10}$/.test(f.whatsapp)) next.whatsapp = "Enter 10 digit WhatsApp";
    return next;
  };

  const isDirty = useMemo(() => {
    if (!user) return false;
    const keys: (keyof Form)[] = [
      "firmName","shopName","state","city","zip","otpMobile","whatsapp","visitingCardUrl"
    ];
    const fieldsChanged = keys.some((k) => (form[k] ?? "") !== ((user as any)[k] ?? ""));
    const fileSelected = !!visitingCardFile;
    return fieldsChanged || fileSelected;
  }, [form, user, visitingCardFile]);

  // ---------- file helpers ----------
  const validateFile = (file: File): string | null => {
    if (!ACCEPT_MIME.includes(file.type)) return "Only PNG, JPG, WEBP, GIF, or PDF allowed";
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_MB) return `Max ${MAX_FILE_MB}MB allowed`;
    return null;
  };

  const setFileWithPreview = (file: File | null) => {
    setVisitingCardFile(file);
    if (!file) { setVisitingCardPreview(null); return; }
    if (file.type === "application/pdf") { setVisitingCardPreview(null); return; }
    const url = URL.createObjectURL(file);
    setVisitingCardPreview(url);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); (e.target as HTMLInputElement).value = ""; return; }
    setFileWithPreview(file);
  };

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); return; }
    setFileWithPreview(file);
  };

  const extractUrl = (data: any): string | null => {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data.url) return data.url;
    if (data.path) return data.path;
    if (data.location) return data.location;
    if (data.file?.url) return data.file.url;
    if (data.result?.url) return data.result.url;
    if (data.filename) return `/uploads/${data.filename}`;
    return null;
  };

  const tryMultipartUpdate = async (id: string, payload: Form, file?: File) => {
    const routes = [
      `/registrations/${id}`,
      `/registration/${id}`,
      `/registrations/update/${id}`,
      `/registration/update/${id}`,
    ];
    const methods: Array<"put" | "patch" | "post"> = ["put", "patch", "post"];
    const fields = ["visitingCard", "file", "image", "document"];
    const makeFD = (field: string) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (file) fd.append(field, file);
      return fd;
    };
    let last: any = null;
    for (const r of routes) for (const m of methods) for (const f of fields) {
      try {
        // @ts-ignore
        const res = await api[m](r, makeFD(f), { headers: { "Content-Type": "multipart/form-data" } });
        return res;
      } catch (err: any) {
        const s = err?.response?.status;
        if (s === 404 || s === 405 || s === 400) { last = err; continue; }
        throw err;
      }
    }
    throw last || new Error("No multipart update endpoint accepted the file");
  };

  const smartUploadVisitingCard = async (file: File): Promise<string> => {
    const endpoints = [
      "/uploads/visiting-card",
      "/upload/visiting-card",
      "/registrations/upload",
      "/registration/upload",
      "/uploads",
      "/upload",
      "/files",
      "/file",
    ];
    const fields = ["visitingCard", "file", "image", "document"];
    let last: any = null;
    for (const ep of endpoints) for (const f of fields) {
      try {
        const fd = new FormData(); fd.append(f, file);
        const res = await api.post(ep, fd, { headers: { "Content-Type": "multipart/form-data" } });
        const url = extractUrl(res.data); if (!url) throw new Error("No URL in response");
        return url;
      } catch (err: any) {
        const s = err?.response?.status;
        if (s === 404 || s === 405 || s === 400) { last = err; continue; }
        throw err;
      }
    }
    throw last || new Error("No matching upload endpoint responded");
  };

  async function smartJsonUpdate(id: string, payload: any) {
    const calls: Array<() => Promise<any>> = [
      () => api.put(`/registrations/${id}`, payload),
      () => api.patch(`/registrations/${id}`, payload),
      () => api.put(`/registration/${id}`, payload),
      () => api.patch(`/registration/${id}`, payload),
      () => api.put(`/registrations/update/${id}`, payload),
      () => api.patch(`/registrations/update/${id}`, payload),
      () => api.post(`/registrations/update/${id}`, payload),
      () => api.post(`/registration/update/${id}`, payload),
      () => api.post(`/registrations`, { _id: id, ...payload }),
      () => api.post(`/registration`, { _id: id, ...payload }),
    ];
    let last: any = null;
    for (const c of calls) { try { return await c(); } catch (e: any) {
      const s = e?.response?.status; if (s === 404 || s === 405) { last = e; continue; } throw e;
    } }
    throw last || new Error("No matching JSON update endpoint responded");
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const v = validate(form); setErrors(v);
    if (Object.keys(v).length) return;
    try {
      setSaving(true);
      if (visitingCardFile) {
        try {
          const res = await tryMultipartUpdate(user._id, form, visitingCardFile);
          const updated = res.data; localStorage.setItem("user", JSON.stringify(updated));
          alert("Profile updated successfully"); navigate("/my-account"); return;
        } catch { /* fallback */ }
      }
      let visitingCardUrl = form.visitingCardUrl || "";
      if (visitingCardFile) visitingCardUrl = await smartUploadVisitingCard(visitingCardFile);
      const json = await smartJsonUpdate(user._id, { ...form, visitingCardUrl });
      const updated = json.data; localStorage.setItem("user", JSON.stringify(updated));
      alert("Profile updated successfully"); navigate("/my-account");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.statusText || err?.message || "Failed to update profile";
      console.error("Profile update error:", err);
      alert(`Failed to update profile: ${msg}`);
    } finally { setSaving(false); }
  };

  const hasExistingCard = !!form.visitingCardUrl && !visitingCardFile;

  return (
    <MainLayout> {/* ✅ sidebar will show */}
      {loading ? (
        <div className="edit-profile-container"><p className="loading-message">Loading your profile…</p></div>
      ) : (
        <div className="edit-profile-container">
          <h2>Edit Profile</h2>
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firmName">Firm Name</label>
                <input id="firmName" name="firmName" value={form.firmName || ""} onChange={handleChange} placeholder="e.g., Bafna Enterprises" autoComplete="organization" />
                {errors.firmName && <span className="error">{errors.firmName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="shopName">Shop Name</label>
                <input id="shopName" name="shopName" value={form.shopName || ""} onChange={handleChange} placeholder="e.g., Bafna Toys" />
                {errors.shopName && <span className="error">{errors.shopName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input id="state" name="state" value={form.state || ""} onChange={handleChange} placeholder="State" autoComplete="address-level1" />
                {errors.state && <span className="error">{errors.state}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city || ""} onChange={handleChange} placeholder="City" autoComplete="address-level2" />
                {errors.city && <span className="error">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="zip">ZIP Code</label>
                <input id="zip" name="zip" inputMode="numeric" value={form.zip || ""} onChange={handleChange} placeholder="560001" autoComplete="postal-code" />
                {errors.zip && <span className="error">{errors.zip}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="otpMobile">Mobile</label>
                <input id="otpMobile" name="otpMobile" inputMode="numeric" value={form.otpMobile || ""} onChange={handleChange} placeholder="10-digit mobile" autoComplete="tel" />
                {errors.otpMobile && <span className="error">{errors.otpMobile}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input id="whatsapp" name="whatsapp" inputMode="numeric" value={form.whatsapp || ""} onChange={handleChange} placeholder="10-digit WhatsApp (optional)" autoComplete="tel" />
                {errors.whatsapp && <span className="error">{errors.whatsapp}</span>}
              </div>

              {/* Visiting Card */}
              <div className="form-group">
                <label>Visiting Card</label>

                {hasExistingCard && (
                  <div className="vc-existing">
                    <a href={form.visitingCardUrl!} target="_blank" rel="noreferrer">View current file</a>
                    <button type="button" className="link-button" onClick={() => setForm((p) => ({ ...p, visitingCardUrl: "" }))}>
                      Remove link
                    </button>
                  </div>
                )}

                {visitingCardPreview && (
                  <div className="vc-preview">
                    <img src={visitingCardPreview} alt="Visiting card preview" />
                    <button type="button" className="link-button" onClick={() => setFileWithPreview(null)}>Remove</button>
                  </div>
                )}

                {visitingCardFile && visitingCardFile.type === "application/pdf" && (
                  <div className="vc-filechip">
                    <span>{visitingCardFile.name}</span>
                    <button type="button" className="link-button" onClick={() => setFileWithPreview(null)}>Remove</button>
                  </div>
                )}

                {!visitingCardFile && (
                  <div
                    className={`vc-dropzone ${dragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (!file) return;
                      const err = ((): string | null => {
                        if (!ACCEPT_MIME.includes(file.type)) return "Only PNG, JPG, WEBP, GIF, or PDF allowed";
                        const sizeMb = file.size / (1024 * 1024);
                        if (sizeMb > MAX_FILE_MB) return `Max ${MAX_FILE_MB}MB allowed`;
                        return null;
                      })();
                      if (err) { alert(err); return; }
                      setFileWithPreview(file);
                    }}
                  >
                    <input
                      id="visitingCard"
                      type="file"
                      accept={ACCEPT_MIME.join(",")}
                      onChange={handleFileInput}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="visitingCard" className="vc-choose">Click to upload</label>
                    <span className="vc-hint">or drag & drop (PNG, JPG, WEBP, GIF, PDF • up to {MAX_FILE_MB}MB)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="ghost-button" onClick={() => navigate("/my-account")} disabled={saving}>
                Cancel
              </button>
              <button className="update-button" type="submit" disabled={saving || !isDirty} title={!isDirty ? "No changes to save" : ""}>
                {saving ? "Saving…" : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  );
};

export default EditProfile;
