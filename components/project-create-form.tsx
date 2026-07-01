"use client";

import { ArrowRight, Building2, Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const initialForm = {
  name: "",
  developer: "",
  location: "",
  property_type: "",
  unit_types: "",
  starting_price: "",
  payment_plan: "",
  handover_date: "",
  main_usps: "",
  target_audience: "",
  language: "English"
};

export function ProjectCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        developer: form.developer.trim() || null,
        location: form.location.trim() || null,
        property_type: form.property_type.trim() || null,
        unit_types: form.unit_types.trim() || null,
        starting_price: form.starting_price.trim() || null,
        payment_plan: form.payment_plan.trim() || null,
        handover_date: form.handover_date.trim() || null,
        main_usps: form.main_usps.trim() || null,
        target_audience: form.target_audience.trim() || null,
        language: form.language.trim() || "English"
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError || !data) {
      setError(insertError?.message || "Could not create the campaign.");
      return;
    }

    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Project name"
          onChange={(value) => updateField("name", value)}
          placeholder="Palm Jumeirah Residences Launch"
          required
          value={form.name}
        />
        <Field
          label="Developer"
          onChange={(value) => updateField("developer", value)}
          placeholder="Developer name"
          value={form.developer}
        />
        <Field
          label="Location"
          onChange={(value) => updateField("location", value)}
          placeholder="Dubai Marina"
          value={form.location}
        />
        <Field
          label="Property type"
          onChange={(value) => updateField("property_type", value)}
          placeholder="Apartment, villa, townhouse"
          value={form.property_type}
        />
        <Field
          label="Unit types"
          onChange={(value) => updateField("unit_types", value)}
          placeholder="1BR, 2BR, 3BR"
          value={form.unit_types}
        />
        <Field
          label="Starting price"
          onChange={(value) => updateField("starting_price", value)}
          placeholder="AED 1.2M"
          value={form.starting_price}
        />
        <Field
          label="Payment plan"
          onChange={(value) => updateField("payment_plan", value)}
          placeholder="60/40, post-handover, etc."
          value={form.payment_plan}
        />
        <Field
          label="Handover date"
          onChange={(value) => updateField("handover_date", value)}
          placeholder="Q4 2027"
          value={form.handover_date}
        />
        <Field
          label="Language"
          onChange={(value) => updateField("language", value)}
          placeholder="English, Arabic, bilingual"
          value={form.language}
        />
      </div>
      <TextArea
        label="Main USPs"
        onChange={(value) => updateField("main_usps", value)}
        placeholder="Waterfront views, low-density masterplan, trusted developer, walking distance to..."
        value={form.main_usps}
      />
      <TextArea
        label="Target audience"
        onChange={(value) => updateField("target_audience", value)}
        placeholder="End-user families, GCC investors, young professionals, second-home buyers..."
        value={form.target_audience}
      />
      {error ? (
        <p className="rounded-md border border-oxide/50 bg-oxide/10 px-3 py-2 text-sm text-[#f0b49d]">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary" disabled={loading} type="submit">
          <Save aria-hidden="true" size={18} />
          {loading ? "Saving campaign..." : "Save Campaign"}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
        <button
          className="btn-secondary"
          onClick={() => router.push("/dashboard")}
          type="button"
        >
          <Building2 aria-hidden="true" size={18} />
          Back to dashboard
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-parchment">{label}</span>
      <input
        className="field"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-parchment">{label}</span>
      <textarea
        className="field min-h-28 resize-y"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
