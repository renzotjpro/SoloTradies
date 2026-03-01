import { Binoculars } from "lucide-react";

export function HeaderGreeting() {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 pt-2 md:pt-12 lg:pt-16 pb-6">
            <div className="relative flex items-center justify-center">
                <div className="absolute -inset-2 rounded-full bg-orange-100/50 blur-lg dark:bg-orange-900/20" />
                <Binoculars
                    className="relative h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-orange-500 stroke-[2.5px] -rotate-12"
                />
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium tracking-tight text-foreground text-center px-4">
                How can I help?
            </h1>
        </div>
    );
}
