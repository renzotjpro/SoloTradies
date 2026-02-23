"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Client {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  abn: string;
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Sam Sheldon",
    role: "Project Manager",
    company: "DreamBuild Co",
    email: "samsheldon@gmail.com",
    phone: "0412 345 678",
    abn: "51 824 753 556",
  },
  {
    id: "2",
    name: "Hrithik Das",
    role: "Electrician",
    company: "SparkWorks",
    email: "hrithikdas@gmail.com",
    phone: "0423 456 789",
    abn: "23 456 789 012",
  },
  {
    id: "3",
    name: "Sophie Nguyen",
    role: "Builder",
    company: "Invisible Homes",
    email: "sophienguyen@gmail.com",
    phone: "0434 567 890",
    abn: "34 567 890 123",
  },
  {
    id: "4",
    name: "Reena Gautham",
    role: "Product Owner",
    company: "Pragathi Trades",
    email: "reenagautham@gmail.com",
    phone: "0445 678 901",
    abn: "45 678 901 234",
  },
  {
    id: "5",
    name: "Suhas Agrawal",
    role: "Plumber",
    company: "FlowRight Plumbing",
    email: "suhasagrawal@gmail.com",
    phone: "0456 789 012",
    abn: "56 789 012 345",
  },
  {
    id: "6",
    name: "Suhana Amit",
    role: "Carpenter",
    company: "TimberCraft",
    email: "suhanaamit@gmail.com",
    phone: "0467 890 123",
    abn: "67 890 123 456",
  },
  {
    id: "7",
    name: "Raghav Agali",
    role: "Landscaper",
    company: "GreenScape Co",
    email: "raghavag@gmail.com",
    phone: "0478 901 234",
    abn: "78 901 234 567",
  },
  {
    id: "8",
    name: "Mehak Deep",
    role: "Painter",
    company: "Nurture Interiors",
    email: "mehakdeep@gmail.com",
    phone: "0489 012 345",
    abn: "89 012 345 678",
  },
  {
    id: "9",
    name: "Sarah Williams",
    role: "Site Supervisor",
    company: "Magnum Structures",
    email: "sarahwilliams@gmail.com",
    phone: "0490 123 456",
    abn: "90 123 456 789",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!search.trim()) return mockClients;
    const q = search.toLowerCase();
    return mockClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          New client
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, or email..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No clients match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="pt-6">
                {/* Avatar + Name + Role */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-11 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {getInitials(client.name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {client.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{client.role}</p>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* 2×2 detail grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Company
                    </p>
                    <p className="text-sm truncate">{client.company}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Email
                    </p>
                    <p className="text-sm truncate">{client.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Phone
                    </p>
                    <p className="text-sm">{client.phone}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">ABN</p>
                    <p className="text-sm">{client.abn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
