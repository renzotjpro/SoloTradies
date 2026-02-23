"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, CreditCard, Users, BarChart3, Settings, HelpCircle, LogOut } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const navItems = [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "Invoices", href: "/invoices", icon: FileText },
        { label: "Payments", href: "/payments", icon: CreditCard },
        { label: "Clients", href: "/clients", icon: Users, hasDropdown: true },
        { label: "Reports", href: "/reports", icon: BarChart3, badge: 120 },
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Help", href: "/help", icon: HelpCircle },
    ];

    function isActive(href: string) {
        if (href === "/") return pathname === "/";
        return pathname === href || pathname.startsWith(href + "/");
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col py-6 px-4 z-10">
            <div className="flex items-center gap-2 mb-10 px-4">
                <div className="text-brand-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                </div>
                <span className="font-bold text-xl tracking-tight text-sidebar-foreground">Invoize</span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-row items-center justify-between px-4 py-3 rounded-2xl transition-colors ${isActive(item.href)
                                ? "bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-brand-900"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
                            <svg className="w-4 h-4 text-sidebar-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <Link href="/logout" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/60 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </Link>
            </div>
        </aside>
    );
}
