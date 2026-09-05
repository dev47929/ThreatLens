import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import {
  User,
  Mail,
  AtSign,
  Key,
  Shield,
  X,
  Save,
  Check,
  Camera,
  Loader2,
  Lock,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, token, updateUser, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setHandle(user.handle || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatar_url || "");
      setPhone(user.phone || "");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        handle: handle.trim(),
        email: email.trim(),
        avatar_url: avatarUrl.trim() || null,
        phone: phone.trim() || null,
      };

      const res = await authApi.updateProfile(token, payload);
      const updatedAccount = res?.account || { ...user, ...payload };

      updateUser(updatedAccount);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to update profile: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updatePassword(token, newPassword);
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Failed to update password: " + (err.message || "Unknown error"));
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (name || user?.name || "TL").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#10151a] border border-[#283747] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#253240] bg-[#12181f]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center">
              <User className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold text-white">Account Profile & Security</h2>
              <p className="text-[10.5px] font-mono text-[#8a99ad]">Manage personal credentials & identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar Preview & Role Badge */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0d10] border border-[#222e3a]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#38bdf8]"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-mono text-base font-bold text-[#03110c] shadow-md shrink-0"
                style={{
                  background: "linear-gradient(135deg, #4d9cff, #38bdf8)",
                }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm truncate">{name || "Security Analyst"}</h3>
              <p className="text-xs font-mono text-[#8a99ad] truncate">@{handle || "analyst"}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/15 text-purple-400 font-bold">
                  {user?.role || "analyst"}
                </span>
                <span className="font-mono text-[9px] text-[#6f8390]">
                  UID: {(user?.uid || user?.id || "local").toString().slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Form 1: Profile Information */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Personal Information</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#8a99ad] uppercase block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full px-3.5 py-2 bg-[#0a0d10] border border-[#283747] rounded-lg text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8a99ad] uppercase block mb-1">Handle / Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g. jdoe"
                      required
                      className="w-full px-3.5 py-2 bg-[#0a0d10] border border-[#283747] rounded-lg text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#8a99ad] uppercase block mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@threatlens.io"
                      required
                      className="w-full px-3.5 py-2 bg-[#0a0d10] border border-[#283747] rounded-lg text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8a99ad] uppercase block mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-[#0a0d10] border border-[#283747] rounded-lg text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#1e5adb] via-[#1342a8] to-[#0c2a74] text-[#E0F2FE] hover:text-white font-bold text-xs font-mono hover:brightness-110 shadow-[0_0_15px_rgba(29,78,216,0.35)] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? "Saving..." : "Save Profile Details"}</span>
              </button>
            </div>
          </form>

          {/* Form 2: Password Update */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t border-[#253240]">
            <div className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Change Password</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#8a99ad] uppercase block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2 bg-[#0a0d10] border border-[#283747] rounded-lg text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8a99ad] uppercase block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 bg-[#0a0d10] border border-[#283747] rounded-lg text-white placeholder-[#6f8390] focus:border-[#38bdf8] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingPassword || !newPassword}
                className="px-4 py-2 rounded-lg border border-[#2b3947] bg-[#141b21] hover:border-[#38bdf8]/50 text-white font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              >
                {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-[#38bdf8]" />}
                <span>{savingPassword ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </form>

          {/* Sign Out Section */}
          <div className="pt-4 border-t border-[#253240] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Session Management</div>
              <div className="text-[11px] text-[#8a99ad]">End your active session on this device</div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await logout();
                  toast.success("Successfully signed out");
                  onClose();
                  setLocation("/login");
                } catch (err) {
                  toast.error("Logout failed: " + (err.message || "Unknown error"));
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
