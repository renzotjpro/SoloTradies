"use client";

import { useBranding } from "@/lib/context/BrandingContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock, ImagePlus } from "lucide-react";

// ---------------------------------------------------------------------------
// Colour palettes from spec
// ---------------------------------------------------------------------------
const PALETTES = [
  { name: "Professional Blue", text: "#1A365D", graphical: "#3182CE", label: "Plumbers, electricians" },
  { name: "Safety Orange", text: "#2D3748", graphical: "#DD6B20", label: "Builders, civil" },
  { name: "Forest Green", text: "#1A3A1A", graphical: "#38A169", label: "Landscapers, arborists" },
  { name: "Clean Slate", text: "#333333", graphical: "#718096", label: "General trades" },
  { name: "Brick Red", text: "#2D1B1B", graphical: "#C53030", label: "Bricklayers, roofers" },
  { name: "Golden Pro", text: "#2D2006", graphical: "#D69E2E", label: "Premium services" },
];

// ---------------------------------------------------------------------------
// Colour picker row
// ---------------------------------------------------------------------------
function ColorField({
  label,
  value,
  fieldKey,
}: {
  label: string;
  value: string;
  fieldKey: "colour_text" | "colour_graphical";
}) {
  const { setFieldImmediate } = useBranding();
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => setFieldImmediate(fieldKey, e.target.value)}
          className="h-9 w-12 rounded border border-border cursor-pointer p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => setFieldImmediate(fieldKey, e.target.value)}
          placeholder="#333333"
          className="font-mono text-sm h-9"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main BrandTab
// ---------------------------------------------------------------------------
export function BrandTab() {
  const { state, setField, setFieldImmediate } = useBranding();
  const s = state.settings;

  function applyPalette(text: string, graphical: string) {
    setFieldImmediate("colour_text", text);
    setFieldImmediate("colour_graphical", graphical);
  }

  return (
    <div className="space-y-6 p-5">
      {/* ── Logo upload (placeholder) ─────────────────── */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Business logo</Label>
        <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-center text-muted-foreground text-sm bg-muted/30 cursor-not-allowed">
          <ImagePlus className="h-8 w-8 opacity-40" />
          <p className="font-medium">Logo upload coming soon</p>
          <p className="text-xs">PNG, JPG, SVG — max 5 MB, min 400 px wide</p>
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded">Phase 2</span>
        </div>
      </div>

      {/* ── Business info ─────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Business Information</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="display_name" className="text-xs text-muted-foreground">Display name</Label>
            <Input
              id="display_name"
              value={s.display_name ?? ""}
              onChange={(e) => setField("display_name", e.target.value)}
              placeholder="Renzo Tello"
              className="mt-1 h-9"
            />
          </div>
          <div>
            <Label htmlFor="business_name" className="text-xs text-muted-foreground">Business / trading name</Label>
            <Input
              id="business_name"
              value={s.business_name ?? ""}
              onChange={(e) => setField("business_name", e.target.value)}
              placeholder="Tello Plumbing Co."
              className="mt-1 h-9"
            />
          </div>
        </div>

        {/* ABN — locked with compliance note */}
        <div>
          <Label htmlFor="abn" className="text-xs text-muted-foreground flex items-center gap-1">
            ABN
            <Lock className="h-3 w-3 text-amber-500" />
          </Label>
          <div className="relative mt-1">
            <Input
              id="abn"
              value={s.abn ?? ""}
              onChange={(e) => setField("abn", e.target.value)}
              placeholder="51 525 585 585"
              className="h-9 pr-12"
            />
          </div>
          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Required on Australian tax invoices
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
            <Input
              id="phone"
              value={s.phone ?? ""}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="0412 345 678"
              className="mt-1 h-9"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
            <Input
              id="email"
              value={s.email ?? ""}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="you@example.com"
              className="mt-1 h-9"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="text-xs text-muted-foreground">Business address</Label>
          <Textarea
            id="address"
            value={s.address ?? ""}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="123 Main St, Sydney NSW 2000"
            className="mt-1 text-sm resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* ── Brand colours ─────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Brand Colours</h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Text colour" value={s.colour_text} fieldKey="colour_text" />
          <ColorField label="Graphical colour" value={s.colour_graphical} fieldKey="colour_graphical" />
        </div>

        {/* Preset palettes */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Trade presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PALETTES.map((p) => {
              const isActive =
                s.colour_text === p.text && s.colour_graphical === p.graphical;
              return (
                <button
                  key={p.name}
                  onClick={() => applyPalette(p.text, p.graphical)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
                    isActive
                      ? "border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="flex gap-1 shrink-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: p.graphical }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: p.text }}
                    />
                  </span>
                  <span>
                    <span className="font-medium block">{p.name}</span>
                    <span className="text-muted-foreground">{p.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
