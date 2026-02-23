import Link from "next/link";
import { LayoutDashboard, FileText, CreditCard, Users, BarChart3, Settings, HelpCircle, LogOut } from "lucide-react";

export function Sidebar() {
    const navItems = [
        { label: "Dashboard", href: "/", icon: LayoutDashboard, active: true },
        { label: "Invoices", href: "/invoices", icon: FileText },
        { label: "Payments", href: "/payments", icon: CreditCard },
        { label: "Clients", href: "/clients", icon: Users, hasDropdown: true },
        { label: "Reports", href: "/reports", icon: BarChart3, badge: 120 },
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Help", href: "/help", icon: HelpCircle },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col py-6 px-4 z-10">
            <div className="flex items-center gap-2 mb-10 px-4">
                <div className="text-emerald-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">Invoize</span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-row items-center justify-between px-4 py-3 rounded-2xl transition-colors ${item.active
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" strokeWidth={2} />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                            <span className="bg-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {item.badge}
                            </span>
                        )}
                        {item.hasDropdown && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <Link href="/logout" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </Link>
            </div>
        </aside>
    );
}
