"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, Plus } from "lucide-react";

const tabs = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Invoices", href: "/invoices", icon: FileText },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomTabNav() {
    const pathname = usePathname();

    function isActive(href: string) {
        if (href === "/") return pathname === "/";
        return pathname === href || pathname.startsWith(href + "/");
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.06)] z-40 flex items-center">
            {/* Left 2 tabs */}
            {tabs.slice(0, 2).map((tab) => (
                <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${isActive(tab.href)
                        ? "text-brand-600"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <tab.icon
                        className="size-5"
                        strokeWidth={isActive(tab.href) ? 2.5 : 2}
                    />
                    <span>{tab.label}</span>
                </Link>
            ))}

            {/* Centre FAB slot */}
            <div className="flex-1 flex items-center justify-center relative">
                <Link
                    href="/invoices/new"
                    className="absolute -top-6 size-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-200 dark:shadow-brand-900/50 transition-colors"
                    aria-label="Create invoice"
                >
                    <Plus className="size-6" strokeWidth={2.5} />
                </Link>
            </div>

            {/* Right 2 tabs */}
            {tabs.slice(2).map((tab) => (
                <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${isActive(tab.href)
                        ? "text-brand-600"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <tab.icon
                        className="size-5"
                        strokeWidth={isActive(tab.href) ? 2.5 : 2}
                    />
                    <span>{tab.label}</span>
                </Link>
            ))}
        </nav>
    );
}
