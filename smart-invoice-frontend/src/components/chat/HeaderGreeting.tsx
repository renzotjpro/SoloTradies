import { Binoculars } from "lucide-react";

export function HeaderGreeting() {
    return (
        <div className="flex flex-col items-center justify-center space-y-6 pt-16 pb-8">
            {/* Icon Wrapper with a soft glow to match the aesthetic */}
            <div className="relative flex items-center justify-center">
                <div className="absolute -inset-2 rounded-full bg-orange-100/50 blur-lg dark:bg-orange-900/20" />
                <Binoculars
                    className="relative h-16 w-16 text-orange-500 stroke-[2.5px] -rotate-12"
                />
            </div>

            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground">
                How can i help you today?
            </h1>
        </div>
    );
}
