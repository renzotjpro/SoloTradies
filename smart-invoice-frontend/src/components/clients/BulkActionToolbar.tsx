import { Button } from "@/components/ui/button";
import { Mail, Download, Trash2, X } from "lucide-react";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onEmail: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  onEmail,
  onExport,
  onDelete
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-white rounded-2xl shadow-2xl border border-blue-100 flex items-center gap-8 min-w-[500px]"
    >
      <div className="flex items-center gap-3 pr-8 border-r border-slate-100 font-bold text-slate-900">
        <span className="bg-blue-600 text-white size-6 rounded-full flex items-center justify-center text-xs">
          {selectedCount}
        </span>
        <span className="text-sm">clients selected</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900 gap-2 h-10 px-4 rounded-xl" onClick={onEmail}>
          <Mail className="size-4" />
          Send Email
        </Button>
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900 gap-2 h-10 px-4 rounded-xl" onClick={onExport}>
          <Download className="size-4" />
          Export Data
        </Button>
        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 h-10 px-4 rounded-xl font-bold" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete Selected
        </Button>
      </div>

      <button 
        onClick={onClear}
        className="p-1 hover:bg-slate-100 rounded-full transition-colors ml-4"
      >
        <X className="size-4 text-slate-400" />
      </button>
    </div>
  );
}
