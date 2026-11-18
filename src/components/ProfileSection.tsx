'use client';

import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiFetch, uploadImageFile } from '@/lib/api';
import type { PublicUser } from '@/lib/salonRules';
import { SalonImage } from './SalonImage';

export function ProfileSection() {
  const { user, setUserDirect } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [image, setImage] = useState(user?.image || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setImage(user.image || '');
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setImage(url);
      showToast('Profile photo uploaded. Click Save Changes to apply.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload profile image.';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ user: PublicUser }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, phone, image }),
      });
      setUserDirect(res.user);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to update profile.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl p-6 sm:p-8 max-w-2xl shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
      <h2 className="font-display text-2xl font-semibold text-[#231A16]">My Profile</h2>
      <p className="mt-1 text-sm text-[#6E6259]">
        Update your display name, contact phone number, and profile portrait.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-[#E5DDD0]/80">
          <SalonImage
            src={image}
            alt={user.name}
            className="w-16 h-16 rounded-xl object-cover border border-[#B5893A]/40 shrink-0"
          />
          <div className="flex-1 space-y-2">
            <label htmlFor="profile-image-url" className="block text-xs font-semibold text-[#231A16]">
              Profile Image (Upload File or Enter URL)
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                id="profile-image-url"
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... or upload an image"
                className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
              />
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#231A16] bg-[#F3EDE2] hover:bg-[#E5DDD0] border border-[#E5DDD0] rounded-lg transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 text-[#9A7028]" aria-hidden="true" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-[#231A16] mb-1.5">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-[#231A16] mb-1.5">
              Phone Number
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (415) 555-0100"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FBF8F3] border border-[#E5DDD0] rounded-lg text-[#231A16] focus:outline-none focus:border-[#B5893A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-email" className="block text-xs font-semibold text-[#6E6259] mb-1.5">
              Email Address (Read-only)
            </label>
            <input
              id="profile-email"
              type="email"
              disabled
              value={user.email}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F3EDE2] border border-[#E5DDD0] rounded-lg text-[#6E6259] cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="profile-role" className="block text-xs font-semibold text-[#6E6259] mb-1.5">
              Account Role
            </label>
            <input
              id="profile-role"
              type="text"
              disabled
              value={user.role.toUpperCase()}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F3EDE2] border border-[#E5DDD0] rounded-lg text-[#6E6259] cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-5 py-2.5 text-sm font-semibold text-[#FBF8F3] bg-[#231A16] hover:bg-[#382B24] border border-[#B5893A]/40 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
