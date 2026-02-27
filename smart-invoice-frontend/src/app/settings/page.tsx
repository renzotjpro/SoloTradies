"use client";

import { useState, useRef } from "react";
import { Pencil, Sun, Moon, Monitor, Palette, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useColorTheme, colorThemes, type ColorThemeName } from "@/lib/theme-colors";

const tabs = ["Profile Information", "Subscription", "System Settings"] as const;
type Tab = (typeof tabs)[number];

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Profile Information");
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="max-w-5xl space-y-6">
      {/* Top Header Card */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center space-x-4">
        <div className="h-16 w-16 bg-[#2a75d3] text-white flex items-center justify-center rounded-full text-3xl font-bold pb-1">
          B<span className="text-xl">.</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Biffco Enterprises Ltd.</h1>
          <p className="text-muted-foreground text-sm mt-1">ABN: 60051779536</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b border-border px-2 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-semibold text-sm transition-colors ${activeTab === tab
                ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Profile Information" && <ProfileInformationTab />}
      {activeTab === "Subscription" && <SubscriptionTab />}
      {activeTab === "System Settings" && (
        <SystemSettingsTab
          theme={theme}
          setTheme={setTheme}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
        />
      )}
    </div>
  );
}

function ProfileInformationTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mt-6">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-brand-500" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Profile Information</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Update your personal details and profile picture.</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 text-muted-foreground hover:bg-muted px-4 py-2 border border-border rounded-lg text-sm font-medium transition-colors">
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Avatar Upload Section */}
      <div className="px-8 pt-8 pb-6 flex items-center gap-8 border-b border-border">
        {/* Avatar Circle */}
        <div className="relative shrink-0">
          <div
            className="h-24 w-24 rounded-full flex items-center justify-center text-2xl font-bold select-none overflow-hidden"
            style={{ background: "hsl(340 80% 94%)" }}
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-brand-600" style={{ letterSpacing: "-0.02em" }}>JD</span>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 6px 20px rgba(249,115,22,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 14px rgba(249,115,22,0.35)";
            }}
          >
            Change Avatar
          </button>
          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      {/* Organisation Details */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
        <InfoField label="Organization Name" value="Biffco Enterprises Ltd." />
        <InfoField label="ABN" value="60051779536" />
        <InfoField label="Industry" value="Information Technology" />
        <InfoField label="Tax Registration Number" value="27ABCDE1234F2Z5" />
        <InfoField label="Phone Number" value="+61 2 1234 5678" />
        <InfoField label="Email ID" value="info@biffco.com.au" />
        <InfoField label="Country" value="Australia" />
        <InfoField label="State" value="New South Wales" />
        <InfoField label="City" value="Sydney" />
        <InfoField label="Address Line 1" value="4th Floor, Alpha Tower" />
        <InfoField label="Address Line 2" value="George Street" />
        <InfoField label="Postcode" value="2000" />
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground font-semibold">{value}</p>
    </div>
  );
}

function SubscriptionTab() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mt-6 p-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Subscription</h2>
      <p className="text-muted-foreground text-sm">
        Subscription management coming soon.
      </p>
    </div>
  );
}

function SystemSettingsTab({
  theme,
  setTheme,
  colorTheme,
  setColorTheme,
}: {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  colorTheme: ColorThemeName;
  setColorTheme: (theme: ColorThemeName) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mt-6 p-8 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">System Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your application preferences.
        </p>
      </div>

      {/* Theme Selector */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Theme</label>
        <p className="text-muted-foreground text-xs">
          Select your preferred appearance.
        </p>
        <div className="flex gap-3 mt-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${isActive
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-400"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Theme Selector */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Theme
        </label>
        <p className="text-muted-foreground text-xs">
          Choose a color palette for buttons and accents.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {(Object.keys(colorThemes) as ColorThemeName[]).map((name) => {
            const { label, shades } = colorThemes[name];
            const isActive = colorTheme === name;
            return (
              <button
                key={name}
                onClick={() => setColorTheme(name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${isActive
                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-400"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: shades[600] }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
