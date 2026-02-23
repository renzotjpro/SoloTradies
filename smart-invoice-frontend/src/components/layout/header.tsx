import { Search, Settings, Bell } from "lucide-react";

export function Header() {
    return (
        <header className="flex flex-row items-center justify-between w-full h-20 px-8 text-gray-600">
            {/* Search Bar */}
            <div className="relative flex items-center bg-gray-50 rounded-full w-96 px-4 py-2 border border-gray-100">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search invoices or clients ✨"
                    className="bg-transparent border-none outline-none w-full ml-3 text-sm placeholder:text-gray-400"
                />
                <button className="text-gray-400 hover:text-gray-600 ml-auto">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </button>
            </div>

            {/* Right Icons & Profile */}
            <div className="flex items-center gap-6">
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 cursor-pointer">
                    <img
                        src="https://faces-img.xcdn.link/thumb-luke-12.jpg"
                        alt="User profile"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
}
