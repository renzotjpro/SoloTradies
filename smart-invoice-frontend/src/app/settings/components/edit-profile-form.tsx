"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Organization } from "@/lib/types/organization";
import { IndustryCombobox } from "./industry-combobox";

const API_BASE = "http://localhost:8000";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  abn: z.string(),
  industry: z.string(),
  tax_reg_number: z.string(),
  phone: z.string(),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal("")),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  address_line1: z.string(),
  address_line2: z.string(),
  postcode: z.string(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

type Props = {
  organization: Organization | null;
  onSaved: (updated: Organization) => void;
  onCancel: () => void;
};

export function EditProfileForm({ organization, onSaved, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name ?? "",
      abn: organization?.abn ?? "",
      industry: organization?.industry ?? "",
      tax_reg_number: organization?.tax_reg_number ?? "",
      phone: organization?.phone ?? "",
      email: organization?.email ?? "",
      country: organization?.country ?? "",
      state: organization?.state ?? "",
      city: organization?.city ?? "",
      address_line1: organization?.address_line1 ?? "",
      address_line2: organization?.address_line2 ?? "",
      postcode: organization?.postcode ?? "",
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])
    );

    try {
      const isNew = organization === null;
      const res = await fetch(`${API_BASE}/organization/`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Failed to save");
      }

      const saved: Organization = await res.json();
      toast.success("Profile saved successfully");
      onSaved(saved);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
      {/* Business Identity */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Business Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Biffco Enterprises Ltd."
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="abn">ABN</Label>
            <Input
              id="abn"
              {...register("abn")}
              placeholder="XX XXX XXX XXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Controller
              name="industry"
              control={control}
              render={({ field }) => (
                <IndustryCombobox
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tax_reg_number">Tax Registration Number</Label>
            <Input
              id="tax_reg_number"
              {...register("tax_reg_number")}
              placeholder="e.g. 27ABCDE1234F2Z5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+61 2 1234 5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="info@company.com.au"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="Australia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              {...register("state")}
              placeholder="New South Wales"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="Sydney"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              {...register("address_line1")}
              placeholder="4th Floor, Alpha Tower"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              {...register("address_line2")}
              placeholder="George Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              {...register("postcode")}
              placeholder="2000"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
