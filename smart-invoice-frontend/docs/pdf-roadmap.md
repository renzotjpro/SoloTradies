# "Get a PDF" Feature Roadmap
> Strategy and implementation plan for the invoice PDF download feature.

## 1. Objective
Wire up the "Get a PDF" button in the invoice "Options" dropdown menu to generate and download a high-quality, A4-formatted PDF of the invoice. 

## 2. Technical Strategy
- **Library:** Use `html2pdf.js` for client-side HTML-to-PDF conversion. This avoids complex server-side render pipelines by safely grabbing the existing React DOM.
- **Dynamic Import:** Because Next.js uses SSR and `html2pdf.js` accesses the `window` object, the library must be imported dynamically inside the action handler.
- **Target Isolation:** The generation logic will target a specific container ID wrapped only around the `InvoicePreview` component, keeping all dashboard UI elements (buttons, sidebars, dropdowns) out of the final document.
- **State Management:** A local boolean state will track the active generation process, updating the UI dropdown item to display "Generating PDF..." with a loading spinner to prevent multiple concurrent clicks.

---

## 3. Implementation Steps

### Phase 1: Setup & Dependencies
- [x] Install the library: `npm install html2pdf.js`.

### Phase 2: UI & State Updates (in `invoices/[id]/page.tsx`)
- [x] Introduce a new state variable: `const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);`
- [x] Update the "Get a PDF" `DropdownMenuItem` inside the View Mode section:
  - Add `onClick={handleGetPdf}`.
  - Disable the button when `isGeneratingPdf` is `true`.
  - Swap the icon to a `<Loader2 className="animate-spin" />` and update the text to `"Generating PDF..."` when active.

### Phase 3: HTML Structure
- [x] In the View Mode grid, find the `<div className="lg:col-span-2">` that wraps the `<InvoicePreview>` component.
- [x] Add `id="invoice-pdf-container"` to this `div`. This will be the specific target for the PDF generation.

### Phase 4: PDF Generation Logic
- [x] Implement the `handleGetPdf` async function:
  ```javascript
  const handleGetPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // 1. Dymamic import of html2pdf
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      // 2. Select target
      const element = document.getElementById("invoice-pdf-container");
      if (!element) throw new Error("Invoice container not found");

      // 3. Prepare safe file name
      const safeClientName = (invoice?.client?.name || "Unknown").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = \`Invoice_\${invoice?.invoice_number}_\${safeClientName}.pdf\`
      
      // 4. Configure PDF options
      const opt = {
        margin:       20, // 20mm margin so content breathes
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, // Scale 2 for high-quality
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // 5. Generate and download
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  ```

---

## 4. Acceptance Criteria
- [x] **Interaction:** Clicking "Get a PDF" shows a loading spinner and changes text to "Generating PDF...".
- [x] **Double-click Prevention:** The button is disabled while generating.
- [x] **Formatting:** The downloaded PDF is A4 format, with 20mm margins on all sides.
- [x] **Content Exclusion:** None of the dashboard UI (sidebar options, top nav, dropdown menu itself) is visible in the final PDF.
- [x] **Branding Integrity:** Accent colors and Header Layout formats appear correctly.
- [x] **File Naming:** Automatically names the downloaded file following the `Invoice_[InvoiceNumber]_[ClientName].pdf` convention stripping illegal characters.
