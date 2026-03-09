"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Palette, Type, Layout, ToggleLeft } from "lucide-react";
import { BrandTab } from "./tabs/BrandTab";
import { FontTab } from "./tabs/FontTab";
import { DesignTab } from "./tabs/DesignTab";
import { ContentTab } from "./tabs/ContentTab";

export function BrandingSettingsPanel() {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="brand" className="flex flex-col h-full">
        {/* Tab list */}
        <div className="border-b border-border px-4 pt-4 bg-card">
          <TabsList className="grid grid-cols-4 w-full h-auto bg-transparent gap-0 p-0">
            {[
              { value: "brand", icon: Palette, label: "Brand" },
              { value: "font", icon: Type, label: "Font" },
              { value: "design", icon: Layout, label: "Design" },
              { value: "content", icon: ToggleLeft, label: "Content" },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col items-center gap-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-brand-600 data-[state=active]:text-brand-600 data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="brand" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
            <BrandTab />
          </TabsContent>
          <TabsContent value="font" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
            <FontTab />
          </TabsContent>
          <TabsContent value="design" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
            <DesignTab />
          </TabsContent>
          <TabsContent value="content" className="mt-0 focus-visible:ring-0 focus-visible:outline-none">
            <ContentTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
