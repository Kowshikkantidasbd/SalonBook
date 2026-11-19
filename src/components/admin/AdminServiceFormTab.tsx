'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { SalonImage } from '@/components/SalonImage';
import { apiFetch, uploadImageFile } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import {
  SALON_CATEGORIES,
  validateServiceInput,
  type ServiceCategory,
  type ServiceRecord,
  type ServiceStatus,
} from '@/lib/salonRules';

export function AdminServiceFormTab({
  editId,
  services,
  onSaved,
}: {
  editId?: string;
  services: ServiceRecord[];
  onSaved: () => Promise<void>;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const editingService = editId ? services.find((s) => s.id === editId) : undefined;

  const [serviceName, setServiceName] = useState(editingService?.serviceName || '');
  const [category, setCategory] = useState<ServiceCategory>(
    editingService?.category || SALON_CATEGORIES[0]
  );
  const [description, setDescription] = useState(editingService?.description || '');
  const [price, setPrice] = useState(editingService ? String(editingService.price) : '');
  const [duration, setDuration] = useState(editingService ? String(editingService.duration) : '60');
  const [image, setImage] = useState(editingService?.image || '');
  const [status, setStatus] = useState<ServiceStatus>(editingService?.status || 'active');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingService) {
      setServiceName(editingService.serviceName);
      setCategory(editingService.category);
      setDescription(editingService.description);
      setPrice(String(editingService.price));
      setDuration(String(editingService.duration));
      setImage(editingService.image);
      setStatus(editingService.status);
    }
  }, [editingService]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setImage(url);
      showToast('Service image uploaded.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Service image upload failed.';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateServiceInput({
      serviceName,
      category,
      description,
      price,
      duration,
      image,
    });
    if (!check.valid) {
      showToast(check.message || 'Please check form fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        serviceName,
        category,
        description,
        price: Number(price),
        duration: Number(duration),
        image,
        status,
      };
      if (editingService) {
        await apiFetch(`/api/admin/services/${encodeURIComponent(editingService.id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Service updated successfully.', 'success');
      } else {
        await apiFetch('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('New salon service created.', 'success');
      }
      await onSaved();
      router.push('/dashboard/admin/services');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save service.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 sm:p-8 max-w-2xl shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5DDD0]/80">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#231A16]">
            {editingService ? 'Update Salon Service' : 'Add New Salon Service'}
          </h2>
          <p className="text-xs text-[#6E6259] mt-1">
            Upload a service photo and configure pricing, duration, and visibility.
          </p>
        </div>
        <Link
          href="/dashboard/admin/services"
          className="text-xs font-semibold text-[#6E6259] hover:text-[#231A16] whitespace-nowrap"
        >
          Back to Services
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="svc-name" className="block text-xs font-semibold text-[#231A16] mb-1.5">
            Service Name
          </label>
          <input
            id="svc-name"
            type="text"
            required
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Botanical Scalp & Gloss Treatment"
            className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="svc-category" className="block text-xs font-semibold text-[#231A16] mb-1.5">
              Service Category
            </label>
            <select
              id="svc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
            >
              {SALON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="svc-status" className="block text-xs font-semibold text-[#231A16] mb-1.5">
              Service Status
            </label>
            <select
              id="svc-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ServiceStatus)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
            >
              <option value="active">Active (Visible & Bookable)</option>
              <option value="inactive">Inactive (Hidden from Public)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="svc-price" className="block text-xs font-semibold text-[#231A16] mb-1.5">
              Price (USD)
            </label>
            <input
              id="svc-price"
              type="number"
              min="1"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="125"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] tabular-nums focus:outline-none focus:border-[#B5893A]"
            />
          </div>

          <div>
            <label htmlFor="svc-duration" className="block text-xs font-semibold text-[#231A16] mb-1.5">
              Estimated Duration (Minutes)
            </label>
            <input
              id="svc-duration"
              type="number"
              min="5"
              step="5"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] tabular-nums focus:outline-none focus:border-[#B5893A]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="svc-description" className="block text-xs font-semibold text-[#231A16] mb-1.5">
            Description
          </label>
          <textarea
            id="svc-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the treatment steps, botanicals used, and expected outcome..."
            className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
          />
        </div>

        <div>
          <span className="block text-xs font-semibold text-[#231A16] mb-2">
            Service Image (Upload Required)
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[#FBF8F3] border border-[#E5DDD0]">
            <div className="w-28 h-20 rounded-lg overflow-hidden border border-[#E5DDD0] bg-[#FFFFFF] shrink-0">
              {image ? (
                <SalonImage
                  src={image}
                  alt="Service preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#6E6259]">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#B5893A]" aria-hidden="true" />
                {uploading ? 'Uploading Image...' : image ? 'Replace Service Image' : 'Upload Service Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-[#6E6259]">
                Accepted formats: JPEG, PNG, WEBP, GIF (max 5MB).
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {saving
              ? 'Saving Service...'
              : editingService
              ? 'Save Service Updates'
              : 'Create Service'}
          </button>
          <Link
            href="/dashboard/admin/services"
            className="w-full sm:w-auto text-center px-4 py-2.5 text-sm font-medium text-[#6E6259] hover:text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] rounded-lg transition-colors whitespace-nowrap"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
