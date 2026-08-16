import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X, Send } from 'lucide-react';
import api from '../utils/api';
import { reverseGeocodeState } from '../utils/indiaGeo';
import LocationPicker from '../components/LocationPicker';
import { useToast } from '../components/Toast';
import { CATEGORIES } from '../utils/priority';

export default function CreateIssuePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    address: '',
    location: { lat: '', lng: '' }
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

const handleImageChange = (e) => {
  const files = Array.from(e.target.files);   // ✅ sahi
  if (files.length + images.length > 5) {
    toast({ variant: 'error', title: 'Too many images', description: 'Maximum 5 images allowed.' });
    return;
  }
  const newUrls = files.map((f) => URL.createObjectURL(f));
  newUrls.forEach((u) => previewUrlsRef.current.add(u));
  setImages((prev) => [...prev, ...files]);
  setPreviews((prev) => [...prev, ...newUrls]);
};

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
    const lat = parseFloat(form.location.lat);
    const lng = parseFloat(form.location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast({ variant: 'error', title: 'Location required', description: 'Add coordinates or use your current location.' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('state', await reverseGeocodeState(lat, lng));
      formData.append('location', JSON.stringify({
        coordinates: [lng, lat],
        address: form.address
      }));
      images.forEach((img) => formData.append('images', img));

      await api.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ variant: 'success', title: 'Issue reported!', description: 'Gemini AI is analyzing it now.' });
      navigate('/community');
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not submit issue',
        description: err.response?.data?.error || 'Something went wrong. Please try again.'
      });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent">
        <ArrowLeft size={14} aria-hidden="true" />
        Back
      </button>

      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Report an Issue</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Describe the problem, pin its location, and Gemini AI will assess priority and suggest solutions.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6 sm:p-8">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Broken streetlight near City Park"
            maxLength={120}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
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
            placeholder="Include when it started, severity, who is affected, etc."
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Location</label>
          <LocationPicker
            value={form.location}
            onChange={(location) => setForm({ ...form, location })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address / Landmark (optional)</label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. Corner of Main St & 2nd Ave"
          />
        </div>

        <div className="form-group">
          <label>Photos (max 5)</label>
          <div
            className="image-upload-zone cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            aria-label="Upload photos"
          >
            <ImagePlus size={22} className="mx-auto mb-1 text-ink-faint" aria-hidden="true" />
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Click to upload photos (jpg, png, gif, webp)
            </p>
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
                  <img src={src} alt={`Preview ${i + 1}`} className="image-preview" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                    aria-label={`Remove image ${i + 1}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-card transition-transform hover:scale-110"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          <Send size={15} aria-hidden="true" />
          {loading ? 'Analyzing with AI…' : 'Submit Issue'}
        </button>
      </form>
    </div>
  );
}
