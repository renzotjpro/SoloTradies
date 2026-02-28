"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, FileDown } from "lucide-react";
import Link from "next/link";
import { BrandingProvider, useBranding } from "@/lib/context/BrandingContext";
import { fetchBranding } from "@/lib/api/branding";
import { BrandingSettingsPanel } from "./components/BrandingSettingsPanel";
import { InvoicePreview } from "./components/InvoicePreview";

// ---------------------------------------------------------------------------
// Inner content – needs to be inside BrandingProvider
// ---------------------------------------------------------------------------
function BrandingPageContent() {
  const { state, load } = useBranding();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"preview" | "settings">("preview");

  useEffect(() => {
    fetchBranding()
      .then((data) => {
        load(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load branding settings. Is the backend running?");
        setLoading(false);
      });
  }, [load]);

  const { saveStatus } = state;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* ── Top bar ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Branding and design
        </Link>

        <div className="flex items-center gap-4">
          {/* Auto-save indicator */}
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Auto-saved
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-destructive" /> Save failed
              </>
            )}
          </span>

          {/* PDF download (deferred) */}
          <button
            disabled
            title="PDF download coming soon"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground cursor-not-allowed opacity-60"
          >
            <FileDown className="h-4 w-4" />
            Download Sample PDF
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium ml-1">
              Soon
            </span>
          </button>
        </div>
      </header>

      {/* ── Mobile view toggle ─────────────────────────────────── */}
      <div className="lg:hidden flex border-b border-border bg-card">
        <button
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            mobileView === "preview"
              ? "text-brand-600 border-b-2 border-brand-600"
              : "text-muted-foreground"
          }`}
        >
          👁 Preview
        </button>
        <button
          onClick={() => setMobileView("settings")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            mobileView === "settings"
              ? "text-brand-600 border-b-2 border-brand-600"
              : "text-muted-foreground"
          }`}
        >
          ⚙ Edit Settings
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {error && (
        <div className="m-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* ── Main split-screen ──────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left — Invoice Preview */}
          <div
            className={`lg:flex lg:w-[55%] flex-col bg-muted/30 border-r border-border overflow-y-auto ${
              mobileView === "preview" ? "flex w-full" : "hidden"
            }`}
          >
            <div className="flex-1 flex items-start justify-center p-6">
              <InvoicePreview />
            </div>
          </div>

          {/* Right — Settings Panel */}
          <div
            className={`lg:flex lg:w-[45%] flex-col overflow-y-auto ${
              mobileView === "settings" ? "flex w-full" : "hidden"
            }`}
          >
            <BrandingSettingsPanel />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export – wraps with provider
// ---------------------------------------------------------------------------
export default function BrandingPage() {
  return (
    <BrandingProvider>
      <BrandingPageContent />
    </BrandingProvider>
  );
}
