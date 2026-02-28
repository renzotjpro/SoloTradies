"use client";

import { useBranding } from "@/lib/context/BrandingContext";

// ---------------------------------------------------------------------------
// Sample data — never changes, represents a real invoice
// ---------------------------------------------------------------------------
const SAMPLE = {
  invoiceNumber: "INV-1234",
  issued: "28 Feb, 2026",
  due: "14 Mar, 2026",
  total: "$495.00",
  clientName: "Jane Appleseed",
  clientCompany: "ACME Pty Ltd",
  items: [
    { desc: "Labour — replace hot water system", qty: 3, unit: "Hour", rate: "$110.00", gst: "$33.00", total: "$330.00" },
    { desc: "Parts — tempering valve + fittings", qty: 1, unit: "Unit", rate: "$120.00", gst: "$12.00", total: "$120.00" },
  ],
  subtotal: "$450.00",
  gst: "$45.00",
  grandTotal: "$495.00",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function px(size: string) {
  if (size === "extra_large") return "13px";
  if (size === "large") return "12px";
  return "10.5px";
}

// ---------------------------------------------------------------------------
// InvoicePreview
// ---------------------------------------------------------------------------
export function InvoicePreview() {
  const { state, getLabel } = useBranding();
  const s = state.settings;

  const baseFont = { fontFamily: s.font_family, fontSize: px(s.font_size) };
  const accentColor = s.colour_graphical;
  const textColor = s.colour_text;
  const isStriped = s.table_style === "striped";
  const isMinimal = s.table_style === "minimal";
  const isBordered = s.table_style === "bordered";

  // Labels (custom or default)
  const L = {
    invoiceTitle: getLabel("invoice_title", "TAX INVOICE"),
    billTo: getLabel("bill_to", "To"),
    number: getLabel("invoice_number", "Number"),
    issued: getLabel("issued_date", "Issued"),
    due: getLabel("due_date", "Due"),
    description: getLabel("description", "Description"),
    quantity: getLabel("quantity", "Qty"),
    rate: getLabel("rate", "Rate"),
    gstCol: getLabel("gst_column", "GST"),
    totalCol: getLabel("total_column", "Total"),
    subtotal: getLabel("subtotal", "Subtotal"),
    gstTotal: getLabel("gst_total", "GST (10%)"),
    grandTotal: getLabel("grand_total", "Total"),
    discount: getLabel("discount", "Discount"),
    paymentHeading: getLabel("payment_heading", "PAYMENT DETAILS"),
  };

  // Header layout helpers
  const isCentred = s.header_layout === "centred";
  const isSplit = s.header_layout === "split";

  return (
    <div
      className="w-full max-w-[640px] bg-white shadow-xl rounded-lg overflow-hidden"
      style={{ ...baseFont, color: "#1a1a1a" }}
    >
      {/* ══ HEADER ═══════════════════════════════════════════════════ */}
      {s.header_layout === "full_bar" && (
        <div style={{ backgroundColor: accentColor }} className="px-7 py-5">
          <div className="flex items-center justify-between">
            <div>
              {/* Logo placeholder or business name */}
              <div className="text-white font-bold text-lg leading-tight">
                {s.business_name || s.display_name || "Your Business Name"}
              </div>
              {s.abn && (
                <div className="text-white/70 text-[9px] mt-0.5">ABN: {s.abn}</div>
              )}
            </div>
            <div
              className="text-right text-white font-bold tracking-wider"
              style={{ color: textColor === "#333333" ? "white" : textColor, fontSize: "16px" }}
            >
              {L.invoiceTitle}
            </div>
          </div>
        </div>
      )}

      {isCentred && (
        <div className="px-7 pt-6 pb-4 text-center border-b border-gray-100">
          <div
            className="inline-block px-4 py-1.5 rounded font-bold tracking-wider text-sm mb-3"
            style={{ backgroundColor: accentColor, color: "white" }}
          >
            {L.invoiceTitle}
          </div>
          <div className="font-bold text-base" style={{ color: textColor }}>
            {s.business_name || s.display_name || "Your Business Name"}
          </div>
          {s.abn && <div className="text-[9px] text-gray-400 mt-0.5">ABN: {s.abn}</div>}
          {s.phone && <div className="text-[9px] text-gray-500">{s.phone}</div>}
          {s.email && <div className="text-[9px] text-gray-500">{s.email}</div>}
        </div>
      )}

      {isSplit && (
        <div className="px-7 pt-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <div className="font-bold text-base" style={{ color: textColor }}>
              {s.business_name || s.display_name || "Your Business Name"}
            </div>
            {s.abn && <div className="text-[9px] text-gray-400 mt-0.5">ABN: {s.abn}</div>}
            {s.address && (
              <div className="text-[9px] text-gray-500 mt-1 whitespace-pre-line">{s.address}</div>
            )}
            {s.phone && <div className="text-[9px] text-gray-500">{s.phone}</div>}
            {s.email && <div className="text-[9px] text-gray-500">{s.email}</div>}
          </div>
          <div
            className="font-bold tracking-wider text-sm px-3 py-1 rounded"
            style={{ backgroundColor: accentColor, color: "white" }}
          >
            {L.invoiceTitle}
          </div>
        </div>
      )}

      {/* ══ BODY ═════════════════════════════════════════════════════ */}
      <div className="px-7 py-5 space-y-4">
        {/* Bill to + meta */}
        <div className="flex justify-between gap-4">
          {/* Bill to */}
          <div className="flex-1">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {L.billTo}
            </div>
            <div className="font-semibold text-[11px]">{SAMPLE.clientName}</div>
            <div className="text-[9px] text-gray-500">{SAMPLE.clientCompany}</div>
            {s.show_client_address && (
              <div className="text-[9px] text-gray-400 mt-0.5">123 Client St, Melbourne VIC 3000</div>
            )}
            {s.show_client_abn && (
              <div className="text-[9px] text-gray-400">ABN: 12 345 678 901</div>
            )}
          </div>

          {/* Meta block */}
          <div className="text-right space-y-1 shrink-0">
            {[
              [L.number, SAMPLE.invoiceNumber],
              ...(s.show_po_number ? [["PO Number", "PO-5678"]] : []),
              [L.issued, SAMPLE.issued],
              ...(s.show_deposit_due_date ? [["Deposit Due", "07 Mar, 2026"]] : []),
              [L.due, SAMPLE.due],
              [L.grandTotal, SAMPLE.total],
            ].map(([label, val]) => (
              <div key={label} className="flex items-baseline justify-end gap-3">
                <span className="text-[9px] text-gray-400">{label}</span>
                <span className="text-[10px] font-semibold min-w-[70px] text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Line items table ──────────────────────────────────── */}
        <div className="mt-2">
          {/* Table header */}
          <div
            className="grid text-[9px] font-semibold uppercase tracking-wide py-1.5 px-2 rounded-sm"
            style={{
              backgroundColor: isBordered || isStriped ? `${accentColor}18` : "transparent",
              color: accentColor,
              gridTemplateColumns: s.show_quantity_column
                ? "1fr 55px 65px 55px 65px"
                : "1fr 65px 55px 65px",
              borderBottom: isMinimal ? `1px solid ${accentColor}40` : undefined,
            }}
          >
            <span>{L.description}</span>
            {s.show_quantity_column && <span className="text-right">{L.quantity}</span>}
            <span className="text-right">{L.rate}</span>
            <span className="text-right">{L.gstCol}</span>
            <span className="text-right">{L.totalCol}</span>
          </div>

          {/* Rows */}
          {SAMPLE.items.map((item, i) => (
            <div
              key={i}
              className="grid items-center py-2 px-2 text-[9.5px]"
              style={{
                gridTemplateColumns: s.show_quantity_column
                  ? "1fr 55px 65px 55px 65px"
                  : "1fr 65px 55px 65px",
                backgroundColor:
                  isStriped && i % 2 === 1 ? "#f7f8fa" : "transparent",
                borderBottom:
                  isBordered || isMinimal ? "1px solid #e5e7eb" : undefined,
              }}
            >
              <span className="text-gray-800">{item.desc}</span>
              {s.show_quantity_column && (
                <span className="text-right text-gray-600">
                  {item.qty}{s.show_quantity_type ? ` ${item.unit}` : ""}
                </span>
              )}
              <span className="text-right text-gray-600">{item.rate}</span>
              <span className="text-right text-gray-500">{item.gst}</span>
              <span className="text-right font-medium">{item.total}</span>
            </div>
          ))}
        </div>

        {/* ── Totals ────────────────────────────────────────────── */}
        <div className="flex justify-end mt-1">
          <div className="w-48 space-y-1">
            {s.show_gst_breakdown && (
              <>
                <div className="flex justify-between text-[9.5px] text-gray-500">
                  <span>{L.subtotal}</span>
                  <span>{SAMPLE.subtotal}</span>
                </div>
                <div className="flex justify-between text-[9.5px] text-gray-500">
                  <span>{L.gstTotal}</span>
                  <span>{SAMPLE.gst}</span>
                </div>
              </>
            )}
            {s.show_discount_row && (
              <div className="flex justify-between text-[9.5px] text-gray-500">
                <span>{L.discount}</span>
                <span>-$0.00</span>
              </div>
            )}
            {s.show_surcharge_row && (
              <div className="flex justify-between text-[9.5px] text-gray-500">
                <span>Surcharge</span>
                <span>$0.00</span>
              </div>
            )}
            <div
              className="flex justify-between font-bold py-1.5 px-2 rounded text-[11px]"
              style={{ backgroundColor: `${accentColor}15`, color: textColor }}
            >
              <span>{L.grandTotal}</span>
              <span>{SAMPLE.grandTotal}</span>
            </div>
            {s.show_balance_due && (
              <div className="flex justify-between text-[9.5px] text-gray-500">
                <span>Amount Due</span>
                <span>{SAMPLE.grandTotal}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Payment details ───────────────────────────────────── */}
        {s.show_payment_details && (
          <div className="pt-3 border-t border-gray-100">
            <div
              className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: accentColor }}
            >
              {L.paymentHeading}
            </div>
            {s.footer_layout === "two_column" ? (
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="text-[8.5px] text-gray-500 whitespace-pre-line leading-relaxed"
                >
                  {s.payment_details || "Bank transfer details here"}
                </div>
                <div className="text-[8.5px] text-gray-500 leading-relaxed">
                  <div className="font-semibold text-gray-600 mb-1">Payments Received</div>
                  No payments received.
                </div>
              </div>
            ) : (
              <div
                className="text-[8.5px] text-gray-500 whitespace-pre-line leading-relaxed"
              >
                {s.payment_details || "Bank transfer details here"}
              </div>
            )}
          </div>
        )}

        {/* ── Footer message ────────────────────────────────────── */}
        {s.show_footer_message && s.footer_message && (
          <div
            className="pt-3 border-t border-gray-100 text-[8.5px] text-gray-400 italic text-center leading-relaxed whitespace-pre-line"
          >
            {s.footer_message}
          </div>
        )}

        {/* ── Terms & conditions ────────────────────────────────── */}
        {s.show_terms_conditions && s.terms_conditions && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[8px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Terms & Conditions
            </div>
            <div className="text-[7.5px] text-gray-400 leading-relaxed whitespace-pre-line">
              {s.terms_conditions}
            </div>
          </div>
        )}
      </div>

      {/* ══ Bottom accent bar ════════════════════════════════════════ */}
      <div style={{ backgroundColor: accentColor, height: "4px" }} />
    </div>
  );
}
