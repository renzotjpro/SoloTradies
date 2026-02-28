"use client";

import { useBranding } from "@/lib/context/BrandingContext";

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Nunito", label: "Nunito" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Playfair Display", label: "Playfair Display" },
];

const SIZES = [
  { value: "regular", label: "Regular", description: "Standard size — works for most tradies" },
  { value: "large", label: "Large", description: "Easier to read — great for emailed PDFs" },
  { value: "extra_large", label: "Extra Large", description: "Maximum readability" },
];

const PREVIEW_TEXT = "The quick brown fox jumps over the lazy dog.";

export function FontTab() {
  const { state, setFieldImmediate } = useBranding();
  const { font_family, font_size } = state.settings;

  return (
    <div className="space-y-6 p-5">
      {/* Font family */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Font Family</h3>
        <div className="space-y-2">
          {FONTS.map((font) => {
            const isActive = font_family === font.value;
            return (
              <button
                key={font.value}
                onClick={() => setFieldImmediate("font_family", font.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                  isActive
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-950"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span
                  style={{ fontFamily: font.value }}
                  className={`text-base ${isActive ? "text-brand-700 dark:text-brand-300 font-semibold" : "text-foreground"}`}
                >
                  {font.label}
                </span>
                {isActive && (
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Selected</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font size */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Font Size</h3>
        <div className="space-y-2">
          {SIZES.map((size) => {
            const isActive = font_size === size.value;
            return (
              <button
                key={size.value}
                onClick={() => setFieldImmediate("font_size", size.value)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                  isActive
                    ? "border-brand-600 bg-brand-50 dark:bg-brand-950"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isActive ? "border-brand-600" : "border-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isActive ? "text-brand-700 dark:text-brand-300" : "text-foreground"}`}>
                    {size.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{size.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="border border-border rounded-xl p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Preview</p>
        <p
          style={{
            fontFamily: font_family,
            fontSize: font_size === "extra_large" ? "18px" : font_size === "large" ? "16px" : "14px",
          }}
          className="text-foreground leading-relaxed"
        >
          {PREVIEW_TEXT}
        </p>
        <p
          style={{ fontFamily: font_family }}
          className={`font-bold mt-2 ${font_size === "extra_large" ? "text-2xl" : font_size === "large" ? "text-xl" : "text-lg"}`}
        >
          TAX INVOICE
        </p>
      </div>
    </div>
  );
}
