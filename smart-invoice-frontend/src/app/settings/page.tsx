"use client";

import { useState } from "react";
import { Sun, Moon, Monitor, Palette, Sparkles, ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useColorTheme, colorThemes, type ColorThemeName } from "@/lib/theme-colors";
import { ProfileInformationTab } from "./components/profile-information-tab";
import Link from "next/link";

const tabs = ["Profile Information", "Branding & Design", "Subscription", "System Settings"] as const;
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
      {activeTab === "Branding & Design" && <BrandingTab />}
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

function BrandingTab() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mt-6 overflow-hidden">
      <div className="border-b border-border bg-muted/40 p-8">
        <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 mb-3">
          <Sparkles className="h-6 w-6" />
          <h2 className="text-xl font-bold text-foreground">Branding & Design</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-xl">
          Customize the look and feel of your invoices. Set your logo, colors, fonts, and layout to ensure your brand stands out when billing clients.
        </p>
      </div>

      <div className="p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
        <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 rounded-2xl p-8 max-w-lg mb-6">
          <h3 className="font-semibold text-lg mb-2">Interactive Brand Customiser</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Launch our full-screen editor to customize your invoice layout, upload your logo, and pick your trading colors through a live preview.
          </p>
          <Link
            href="/settings/branding"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-xl shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            Launch Brand Editor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
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
