import { BarChart3, FileLineChart } from "lucide-react";

type ExamplePromptsProps = {
    onSelect: (prompt: string) => void;
};

const EXAMPLES = [
    {
        title: "Analyze Invoice Trends",
        description: "View spending patterns and identify cost-saving opportunities over time.",
        prompt: "Analyze my recent invoices and show me spending trends per category.",
        icon: BarChart3,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
    },
    {
        title: "Generate Quarterly Report",
        description: "Automatically summarize all financial activities into a formatted PDF.",
        prompt: "Generate a quarterly financial summary report for Q1 2024.",
        icon: FileLineChart,
        color: "text-blue-500",
        bg: "bg-blue-50",
    },
];

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
    return (
        <div className="w-full mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAMPLES.map((item) => (
                    <button
                        key={item.title}
                        onClick={() => onSelect(item.prompt)}
                        className="group text-left p-6 rounded-2xl border border-border bg-background hover:bg-muted/50 hover:border-brand-200 transition-all cursor-pointer w-full flex gap-4"
                    >
                        <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-lg text-foreground group-hover:text-brand-600 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
