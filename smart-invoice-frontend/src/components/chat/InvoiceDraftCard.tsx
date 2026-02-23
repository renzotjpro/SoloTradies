import { FileText, CheckCircle2 } from "lucide-react";

type InvoiceDraftCardProps = {
    data: {
        client?: string;
        service?: string;
        amount?: string;
        date?: string;
    };
};

export function InvoiceDraftCard({ data }: InvoiceDraftCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden w-80">
            <div className="bg-brand-50 px-4 py-3 border-b border-brand-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span className="font-semibold text-brand-900 text-sm">Invoice Details Draft</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Client:</span>
                    <span className="font-medium text-gray-900">{data.client}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-medium text-gray-900">{data.service}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium text-gray-900">{data.amount}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">{data.date}</span>
                </div>
                <button className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-xl flex justify-center items-center gap-2 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Generate PDF
                </button>
            </div>
        </div>
    );
}
