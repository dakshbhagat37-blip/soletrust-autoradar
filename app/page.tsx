import { supabase } from "@/lib/supabase/client";

export default async function Home() {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*");

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      
      {/* Header */}
      <h1 className="text-3xl font-bold">
        Sole Trust AutoRadar
      </h1>

      <p className="mt-2 text-gray-400">
        Lead Intelligence & CRM
      </p>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">

        <div className="rounded-xl bg-gray-900 p-5">
          <p className="text-gray-400">Discovered</p>
          <h2 className="mt-2 text-3xl font-bold">
            {leads?.length ?? 0}
          </h2>
        </div>

        <div className="rounded-xl bg-gray-900 p-5">
          <p className="text-gray-400">Qualified</p>
          <h2 className="mt-2 text-3xl font-bold">
            {leads?.filter(
              (lead) => lead.status === "qualified"
            ).length ?? 0}
          </h2>
        </div>

        <div className="rounded-xl bg-gray-900 p-5">
          <p className="text-gray-400">Contacted</p>
          <h2 className="mt-2 text-3xl font-bold">
            {leads?.filter(
              (lead) => lead.status === "contacted"
            ).length ?? 0}
          </h2>
        </div>

        <div className="rounded-xl bg-gray-900 p-5">
          <p className="text-gray-400">Meetings</p>
          <h2 className="mt-2 text-3xl font-bold">
            {leads?.filter(
              (lead) => lead.status === "meeting"
            ).length ?? 0}
          </h2>
        </div>

      </div>

      {/* Leads */}
      <section className="mt-10">

        <h2 className="text-2xl font-bold">
          Leads
        </h2>

        {error && (
          <p className="mt-4 text-red-400">
            Error: {error.message}
          </p>
        )}

        <div className="mt-4 space-y-4">

          {leads?.map((lead) => (

            <div
              key={lead.id}
              className="rounded-xl bg-gray-900 p-6"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-semibold">
                    {lead.company_name}
                  </h3>

                  <p className="mt-1 text-gray-400">
                    {lead.industry} • {lead.city}, {lead.country}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {lead.employee_range} employees
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-gray-400">
                    Score
                  </p>

                  <p className="text-3xl font-bold">
                    {lead.score}
                  </p>

                </div>

              </div>

              <div className="mt-4 flex gap-3">

                <span className="rounded-full bg-gray-800 px-3 py-1 text-sm">
                  {lead.service_track}
                </span>

                <span className="rounded-full bg-gray-800 px-3 py-1 text-sm">
                  {lead.status}
                </span>

              </div>

            </div>

          ))}

        </div>

      </section>

    </main>
  );
}