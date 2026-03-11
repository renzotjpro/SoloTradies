import { Binoculars } from "lucide-react";

export function HeaderGreeting() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 pt-12 md:pt-20 pb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground text-center px-4">
                How can I help?
            </h1>
            <p className="text-muted-foreground text-center max-w-2xl text-lg md:text-xl">
                Analyze invoices, generate reports, or forecast spending with Invoize AI.
            </p>
        </div>
    );
}
