import { supabase } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadPage({ params }: PageProps) {
  const { id } = await params;

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) {
    return <h1>Lead not found</h1>;
  }

  return (
    <main>
      <h1>{lead.company_name}</h1>

      <p>Industry: {lead.industry}</p>
      <p>Location: {lead.city}, {lead.country}</p>
      <p>Employees: {lead.employee_range}</p>
      <p>Score: {lead.score}</p>
      <p>Status: {lead.status}</p>
    </main>
  );
}