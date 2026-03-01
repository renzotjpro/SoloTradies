type ExamplePromptsProps = {
    onSelect: (prompt: string) => void;
};

const EXAMPLES = [
    "Create an invoice for John Smith for plumbing work, $450",
    "Invoice ABC Constructions for 8 hours of electrical work at $95/hour",
    "Draft an invoice for Sarah Johnson — roof repair, $1,200, due in 30 days",
    "Bill Sunset Homes for 3 days of painting at $280/day",
    "Create invoice for Mike Chen, solar panel installation, $3,500",
];

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
    return (
        <div className="w-full">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Try an example
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EXAMPLES.map((example) => (
                    <button
                        key={example}
                        onClick={() => onSelect(example)}
                        className="text-left rounded-xl border border-border bg-background hover:bg-muted hover:border-brand-300 transition-colors px-4 py-3 text-sm text-foreground leading-snug cursor-pointer w-full"
                    >
                        {example}
                    </button>
                ))}
            </div>
        </div>
    );
}
