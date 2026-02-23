import { Pencil } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="max-w-5xl space-y-6">
            {/* Top Header Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
                <div className="h-16 w-16 bg-[#2a75d3] text-white flex items-center justify-center rounded-full text-3xl font-bold pb-1">
                    B<span className="text-xl">.</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Biffco Enterprises Ltd.</h1>
                    <p className="text-gray-500 text-sm mt-1">ABN: 60051779536</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-8 border-b border-gray-200 px-2 mt-4">
                <button className="text-[#3ba27a] border-b-2 border-[#3ba27a] pb-3 font-semibold text-sm">
                    Basic Information
                </button>
                <button className="text-gray-500 hover:text-gray-700 pb-3 font-semibold text-sm transition-colors">
                    Subscription
                </button>
                <button className="text-gray-500 hover:text-gray-700 pb-3 font-semibold text-sm transition-colors">
                    System Settings
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Basic Information</h2>
                    <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors">
                        <Pencil className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Organization Name</p>
                        <p className="text-sm text-gray-800 font-semibold">Biffco Enterprises Ltd.</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">ABN</p>
                        <p className="text-sm text-gray-800 font-semibold">60051779536</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Industry</p>
                        <p className="text-sm text-gray-800 font-semibold">Information Technology</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Tax Registration Number</p>
                        <p className="text-sm text-gray-800 font-semibold">27ABCDE1234F2Z5</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Phone Number</p>
                        <p className="text-sm text-gray-800 font-semibold">+61 2 1234 5678</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Email ID</p>
                        <p className="text-sm text-gray-800 font-semibold">info@biffco.com.au</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Country</p>
                        <p className="text-sm text-gray-800 font-semibold">Australia</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">State</p>
                        <p className="text-sm text-gray-800 font-semibold">New South Wales</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">City</p>
                        <p className="text-sm text-gray-800 font-semibold">Sydney</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Address Line 1</p>
                        <p className="text-sm text-gray-800 font-semibold">4th Floor, Alpha Tower</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Address Line 2</p>
                        <p className="text-sm text-gray-800 font-semibold">George Street</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm text-gray-400 font-medium">Postcode</p>
                        <p className="text-sm text-gray-800 font-semibold">2000</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
