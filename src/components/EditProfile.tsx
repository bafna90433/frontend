// src/components/EditProfile.tsx
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
import MainLayout from "../components/MainLayout";
import "../styles/EditProfile.css";

interface User {
  _id: string;
  shopName: string;
  otpMobile: string;
  whatsapp: string;          // ✅ required
  visitingCardUrl: string;   // ✅ required
  isApproved?: boolean;
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
        shopName: parsed.shopName ?? "",
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
    if (!f.shopName?.trim()) next.shopName = "Shop name is required";
    if (!f.otpMobile?.trim()) next.otpMobile = "Mobile is required";
    if (f.otpMobile && !/^\d{10}$/.test(f.otpMobile)) next.otpMobile = "Enter 10 digit mobile";
    if (!f.whatsapp?.trim()) next.whatsapp = "WhatsApp is required";
    if (f.whatsapp && !/^\d{10}$/.test(f.whatsapp)) next.whatsapp = "Enter 10 digit WhatsApp";
    if (!f.visitingCardUrl && !visitingCardFile) next.visitingCardUrl = "Visiting Card is required";
    return next;
  };

  const isDirty = useMemo(() => {
    if (!user) return false;
    const keys: (keyof Form)[] = ["shopName","otpMobile","whatsapp","visitingCardUrl"];
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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); return; }
    setFileWithPreview(file);
  };

  // ---------- submit ----------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const v = validate(form); setErrors(v);
    if (Object.keys(v).length) return;
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (visitingCardFile) fd.append("visitingCard", visitingCardFile);
      const { data } = await api.put(`/registrations/${user._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      localStorage.setItem("user", JSON.stringify(data));
      alert("Profile updated successfully");
      navigate("/my-account");
    } catch (err: any) {
      console.error("Profile update error:", err);
      alert("Failed to update profile");
    } finally { setSaving(false); }
  };

  const hasExistingCard = !!form.visitingCardUrl && !visitingCardFile;

  return (
    <MainLayout>
      {loading ? (
        <div className="edit-profile-container"><p className="loading-message">Loading your profile…</p></div>
      ) : (
        <div className="edit-profile-container">
          <h2>Edit Profile</h2>
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="shopName">Shop Name</label>
                <input id="shopName" name="shopName" value={form.shopName || ""} onChange={handleChange} />
                {errors.shopName && <span className="error">{errors.shopName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="otpMobile">Mobile</label>
                <input id="otpMobile" name="otpMobile" inputMode="numeric" value={form.otpMobile || ""} onChange={handleChange} />
                {errors.otpMobile && <span className="error">{errors.otpMobile}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input id="whatsapp" name="whatsapp" inputMode="numeric" value={form.whatsapp || ""} onChange={handleChange} />
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
                {!visitingCardFile && (
                  <div
                    className={`vc-dropzone ${dragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      id="visitingCard"
                      type="file"
                      accept={ACCEPT_MIME.join(",")}
                      onChange={handleFileInput}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="visitingCard" className="vc-choose">Click to upload</label>
                    <span className="vc-hint">PNG, JPG, WEBP, GIF, PDF • up to {MAX_FILE_MB}MB</span>
                  </div>
                )}
                {errors.visitingCardUrl && <span className="error">{errors.visitingCardUrl}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="ghost-button" onClick={() => navigate("/my-account")} disabled={saving}>
                Cancel
              </button>
              <button className="update-button" type="submit" disabled={saving || !isDirty}>
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
