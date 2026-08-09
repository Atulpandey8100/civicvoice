import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { CATEGORIES } from '../utils/priority';

export default function EditIssuePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    address: '',
    lng: '',
    lat: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    api.get(`/issues/${id}`).then(({ data }) => {
      if (data.author?._id !== user.id && user.role === 'resident') {
        toast({ variant: 'error', title: 'Not allowed', description: 'You can only edit your own issues.' });
        navigate('/community');
        return;
      }
      setForm({
        title: data.title,
        description: data.description,
        category: data.category,
        address: data.location?.address || '',
        lng: data.location?.coordinates?.[0]?.toString() || '',
        lat: data.location?.coordinates?.[1]?.toString() || ''
      });
      setExistingImages(data.images || []);
      setLoading(false);
    }).catch(() => {
      toast({ variant: 'error', title: 'Issue not found', description: 'This issue may have been removed.' });
      navigate('/community');
    });
  }, [id, user]);

  const handleImageChange = (e) => {
    const files = Array.from(e.files);
    if (files.length + existingImages.length + newImages.length > 5) {
      toast({ variant: 'error', title: 'Too many images', description: 'Maximum 5 images allowed.' });
      return;
    }
    const newUrls = files.map((f) => URL.createObjectURL(f));
    newUrls.forEach((u) => previewUrlsRef.current.add(u));
    setNewImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newUrls]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) {
        previewUrlsRef.current.delete(url);
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast({ variant: 'error', title: 'Location required', description: 'Enter valid coordinates.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('location', JSON.stringify({
        coordinates: [lng, lat],
        address: form.address
      }));
      newImages.forEach((img) => formData.append('images', img));

      const { data } = await api.put(`/issues/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ variant: 'success', title: 'Issue updated' });
      navigate(`/issues/${data._id}`);
    } catch (err) {
      toast({ variant: 'error', title: 'Could not update issue', description: err.response?.data?.error || 'Something went wrong. Please try again.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <LoadingSkeleton count={1} variant="card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link to={`/issues/${id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent">
        <ArrowLeft size={14} aria-hidden="true" />
        Back to Issue
      </Link>

      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Edit Issue</h1>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6 sm:p-8">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={120}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        {existingImages.length > 0 && (
          <div className="form-group">
            <label>Current Images</label>
            <div className="image-preview-grid">
              {existingImages.map((src, i) => (
                <img key={i} src={src} alt={`Current image ${i + 1}`} className="image-preview" />
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Add New Images (max 5)</label>
          <div
            className="image-upload-zone cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            aria-label="Upload new photos"
          >
            <ImagePlus size={22} className="mx-auto mb-1 text-ink-faint" aria-hidden="true" />
            <p className="text-sm text-ink-soft">Click to upload images (jpg, png, gif, webp)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          {previews.length > 0 && (
            <div className="image-preview-grid">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`New image ${i + 1}`} className="image-preview" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    aria-label={`Remove new image ${i + 1}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-card transition-transform hover:scale-110"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="address">Address / Landmark (optional)</label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="grid">
          <div className="form-group">
            <label htmlFor="lng">Longitude</label>
            <input
              id="lng"
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lat">Latitude</label>
            <input
              id="lat"
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          <Send size={15} aria-hidden="true" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
