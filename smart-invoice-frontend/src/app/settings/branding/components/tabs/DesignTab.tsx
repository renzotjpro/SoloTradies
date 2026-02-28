"use client";

import { useBranding } from "@/lib/context/BrandingContext";

// ---------------------------------------------------------------------------
// Option grid helper
// ---------------------------------------------------------------------------
function OptionGrid<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string; preview: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                isActive
                  ? "border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 ring-2 ring-brand-600/30"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              <div className="w-full h-14 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 border border-border/60 flex items-center justify-center">
                {opt.preview}
              </div>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini SVG thumbnails
// ---------------------------------------------------------------------------
const HeaderPreview = {
  full_bar: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="0" y="0" width="80" height="12" fill="#3182CE" />
      <rect x="4" y="3" width="16" height="6" rx="1" fill="white" opacity="0.7" />
      <rect x="55" y="3" width="20" height="6" rx="1" fill="white" opacity="0.5" />
      <rect x="4" y="16" width="24" height="2" rx="1" fill="#CBD5E0" />
      <rect x="4" y="20" width="16" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
  centred: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="28" y="2" width="24" height="8" rx="2" fill="#3182CE" opacity="0.6" />
      <rect x="20" y="13" width="40" height="2" rx="1" fill="#CBD5E0" />
      <rect x="24" y="17" width="32" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="26" width="72" height="1" fill="#E2E8F0" />
    </svg>
  ),
  split: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="18" height="10" rx="2" fill="#3182CE" opacity="0.5" />
      <rect x="46" y="4" width="28" height="3" rx="1" fill="#CBD5E0" />
      <rect x="46" y="9" width="20" height="2" rx="1" fill="#E2E8F0" />
      <rect x="46" y="13" width="24" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="22" width="72" height="1" fill="#E2E8F0" />
    </svg>
  ),
};

const FooterPreview = {
  full_width: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="72" height="3" rx="1" fill="#CBD5E0" />
      <rect x="4" y="10" width="60" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="14" width="50" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="18" width="55" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
  two_column: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="34" height="3" rx="1" fill="#CBD5E0" />
      <rect x="44" y="4" width="32" height="3" rx="1" fill="#CBD5E0" />
      <rect x="4" y="10" width="28" height="2" rx="1" fill="#E2E8F0" />
      <rect x="44" y="10" width="24" height="2" rx="1" fill="#E2E8F0" />
      <rect x="4" y="14" width="30" height="2" rx="1" fill="#E2E8F0" />
      <rect x="44" y="14" width="20" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
};

const TablePreview = {
  bordered: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="72" height="8" rx="1" fill="#3182CE" opacity="0.15" />
      <rect x="4" y="4" width="72" height="8" rx="1" fill="none" stroke="#CBD5E0" strokeWidth="0.5" />
      <rect x="4" y="12" width="72" height="6" fill="none" stroke="#CBD5E0" strokeWidth="0.5" />
      <rect x="4" y="18" width="72" height="6" fill="none" stroke="#CBD5E0" strokeWidth="0.5" />
      <rect x="4" y="24" width="72" height="6" fill="none" stroke="#CBD5E0" strokeWidth="0.5" />
    </svg>
  ),
  striped: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="72" height="7" rx="1" fill="#3182CE" opacity="0.15" />
      <rect x="4" y="11" width="72" height="7" fill="#F7FAFC" />
      <rect x="4" y="18" width="72" height="7" fill="#EDF2F7" />
      <rect x="4" y="25" width="72" height="7" fill="#F7FAFC" />
    </svg>
  ),
  minimal: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="4" width="72" height="7" rx="1" fill="#3182CE" opacity="0.1" />
      <line x1="4" y1="11" x2="76" y2="11" stroke="#E2E8F0" strokeWidth="0.5" />
      <line x1="4" y1="18" x2="76" y2="18" stroke="#E2E8F0" strokeWidth="0.5" />
      <line x1="4" y1="25" x2="76" y2="25" stroke="#E2E8F0" strokeWidth="0.5" />
    </svg>
  ),
};

const LogoPositionPreview = {
  top_left: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="4" y="8" width="20" height="12" rx="2" fill="#3182CE" opacity="0.4" />
      <rect x="30" y="10" width="30" height="3" rx="1" fill="#CBD5E0" />
      <rect x="30" y="16" width="20" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
  top_centre: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="28" y="4" width="24" height="12" rx="2" fill="#3182CE" opacity="0.4" />
      <rect x="20" y="20" width="40" height="2" rx="1" fill="#CBD5E0" />
      <rect x="25" y="24" width="30" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
  top_right: (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <rect x="56" y="8" width="20" height="12" rx="2" fill="#3182CE" opacity="0.4" />
      <rect x="4" y="10" width="30" height="3" rx="1" fill="#CBD5E0" />
      <rect x="4" y="16" width="20" height="2" rx="1" fill="#E2E8F0" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Main DesignTab
// ---------------------------------------------------------------------------
export function DesignTab() {
  const { state, setFieldImmediate } = useBranding();
  const s = state.settings;

  return (
    <div className="space-y-6 p-5">
      <OptionGrid
        title="Header Layout"
        options={[
          { value: "full_bar", label: "Full bar", preview: HeaderPreview.full_bar },
          { value: "centred", label: "Centred", preview: HeaderPreview.centred },
          { value: "split", label: "Split", preview: HeaderPreview.split },
        ]}
        value={s.header_layout as "full_bar" | "centred" | "split"}
        onChange={(v) => setFieldImmediate("header_layout", v)}
      />

      <OptionGrid
        title="Footer Layout"
        options={[
          { value: "full_width", label: "Full width", preview: FooterPreview.full_width },
          { value: "two_column", label: "Two columns", preview: FooterPreview.two_column },
        ]}
        value={s.footer_layout as "full_width" | "two_column"}
        onChange={(v) => setFieldImmediate("footer_layout", v)}
      />

      <OptionGrid
        title="Table Style"
        options={[
          { value: "bordered", label: "Bordered", preview: TablePreview.bordered },
          { value: "striped", label: "Striped", preview: TablePreview.striped },
          { value: "minimal", label: "Minimal", preview: TablePreview.minimal },
        ]}
        value={s.table_style as "bordered" | "striped" | "minimal"}
        onChange={(v) => setFieldImmediate("table_style", v)}
      />

      <OptionGrid
        title="Logo Position"
        options={[
          { value: "top_left", label: "Left", preview: LogoPositionPreview.top_left },
          { value: "top_centre", label: "Centre", preview: LogoPositionPreview.top_centre },
          { value: "top_right", label: "Right", preview: LogoPositionPreview.top_right },
        ]}
        value={s.logo_position as "top_left" | "top_centre" | "top_right"}
        onChange={(v) => setFieldImmediate("logo_position", v)}
      />
    </div>
  );
}
