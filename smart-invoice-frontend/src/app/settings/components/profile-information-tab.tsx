"use client";

import { useState, useEffect } from "react";
import { Pencil, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Organization } from "@/lib/types/organization";
import { EditProfileForm } from "./edit-profile-form";

const API_BASE = "http://localhost:8000";

export function ProfileInformationTab() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const res = await fetch(`${API_BASE}/organization/`);
        if (res.status === 404) {
          setOrganization(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch organization");
        const data: Organization = await res.json();
        setOrganization(data);
      } catch {
        toast.error("Could not load profile. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    fetchOrganization();
  }, []);

  function handleSaved(updated: Organization) {
    setOrganization(updated);
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm mt-6 flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mt-6">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-brand-500" />
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Profile Information
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Update your organization details.
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 text-muted-foreground hover:bg-muted px-4 py-2 border border-border rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Body */}
      {isEditing ? (
        <EditProfileForm
          organization={organization}
          onSaved={handleSaved}
          onCancel={() => setIsEditing(false)}
        />
      ) : organization ? (
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
          <InfoField label="Organization Name" value={organization.name} />
          <InfoField label="ABN" value={organization.abn} />
          <InfoField label="Industry" value={organization.industry} />
          <InfoField
            label="Tax Registration Number"
            value={organization.tax_reg_number}
          />
          <InfoField label="Phone Number" value={organization.phone} />
          <InfoField label="Email ID" value={organization.email} />
          <InfoField label="Country" value={organization.country} />
          <InfoField label="State" value={organization.state} />
          <InfoField label="City" value={organization.city} />
          <InfoField label="Address Line 1" value={organization.address_line1} />
          <InfoField label="Address Line 2" value={organization.address_line2} />
          <InfoField label="Postcode" value={organization.postcode} />
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            No organization profile set up yet.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium underline underline-offset-2"
          >
            Set up your profile
          </button>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground font-semibold">
        {value ?? (
          <span className="text-muted-foreground italic font-normal">
            Not set
          </span>
        )}
      </p>
    </div>
  );
}
