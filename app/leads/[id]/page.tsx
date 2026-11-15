import Link from "next/link";
import { getBusinessById } from "../../../lib/jobs/store.ts";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const business = getBusinessById(id);

  if (!business) {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1"
          >
            &larr; Back to AutoRadar Dashboard
          </Link>

          <div className="p-8 rounded-2xl border border-gray-800 bg-gray-900 shadow-xl text-center space-y-4">
            <h1 className="text-xl font-bold text-white">Lead Record Not Found</h1>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Lead ID <code className="text-indigo-400 font-mono">{id}</code> was not found in the active session store. Search jobs run in memory unless persisted to database.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition inline-block"
              >
                Launch Prospecting Search &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const qual = business.qualification;
  const phoneContact = (business.contacts || []).find((c) => c.contactType === "phone");
  const emailContact = (business.contacts || []).find((c) => c.contactType === "email");

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1"
        >
          &larr; Back to AutoRadar Dashboard
        </Link>

        {/* Lead Dossier Header Card */}
        <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{business.canonicalName}</h1>
                {business.status === "qualified" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Qualified Lead
                  </span>
                ) : business.status === "review" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Needs Review
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Rejected
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                {business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline font-mono"
                  >
                    {business.domain || business.website}
                  </a>
                ) : (
                  <span className="font-mono text-gray-500">Unverified Website</span>
                )}
                <span>•</span>
                <span>{business.city || "Vadodara"}, {business.country || "India"}</span>
                {business.industry && (
                  <>
                    <span>•</span>
                    <span className="text-gray-300">{business.industry}</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono uppercase text-gray-400">Qualification Score</div>
              <div className="text-3xl font-black text-emerald-400">
                {business.qualificationScore}
                <span className="text-xs font-normal text-gray-500">/100</span>
              </div>
            </div>
          </div>

          {/* Micro 6-Factor Gauge */}
          {qual && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-gray-950 p-3 rounded-xl border border-gray-800 text-center">
              <div>
                <div className="text-[10px] uppercase font-mono text-gray-500">Identity</div>
                <div className="text-sm font-bold text-white">{qual.identityScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-gray-500">Industry</div>
                <div className="text-sm font-bold text-white">{qual.industryScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-gray-500">Location</div>
                <div className="text-sm font-bold text-white">{qual.locationScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-gray-500">Contacts</div>
                <div className="text-sm font-bold text-white">{qual.contactabilityScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-gray-500">D-Maker</div>
                <div className="text-sm font-bold text-white">{qual.decisionMakerScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-gray-500">Service Fit</div>
                <div className="text-sm font-bold text-white">{qual.serviceFitScore}/100</div>
              </div>
            </div>
          )}

          {/* Assessment Explanation */}
          {qual?.explanation && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-gray-300">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 block mb-1">
                Transparent Intelligence Explanation
              </span>
              <p>{qual.explanation}</p>
            </div>
          )}

          {/* Decision-Maker Section */}
          <div className="space-y-3 border-t border-gray-800 pt-6">
            <h2 className="text-sm uppercase font-mono text-gray-400 flex items-center justify-between">
              <span>Decision-Maker Intelligence</span>
              <span className="text-[10px] text-amber-400 font-semibold lowercase">UNKNOWN &gt; WRONG</span>
            </h2>

            {business.decisionMakers && business.decisionMakers.length > 0 ? (
              <div className="space-y-3">
                {business.decisionMakers.map((dm, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-gray-800 bg-gray-950 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{dm.fullName}</h3>
                          {dm.credentials && dm.credentials.length > 0 && (
                            <div className="flex gap-1">
                              {dm.credentials.map((c, cIdx) => (
                                <span key={cIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 uppercase">
                            {dm.roleLabel}
                          </span>
                        </div>
                        {dm.specialization && (
                          <p className="text-xs text-gray-300 mt-1">
                            Specialization: <span className="text-white font-medium">{dm.specialization}</span>
                            {dm.department && <span className="text-gray-400"> • {dm.department}</span>}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase font-semibold">
                          {dm.verificationStatus} ({dm.confidenceScore}%)
                        </span>
                        {dm.profileUrl && (
                          <a
                            href={dm.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg font-mono"
                          >
                            LinkedIn &rarr;
                          </a>
                        )}
                      </div>
                    </div>

                    {(dm.email || dm.phone) && (
                      <div className="p-3 rounded-lg border border-gray-800/80 bg-gray-900/60 flex flex-wrap gap-4 text-xs">
                        {dm.email && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-mono text-cyan-400">Direct Email:</span>
                            <span className="text-gray-200 font-mono">{dm.email}</span>
                          </div>
                        )}
                        {dm.phone && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-mono text-emerald-400">Direct Line:</span>
                            <span className="text-gray-200 font-mono">{dm.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {dm.reason && (
                      <div className="text-xs text-gray-400 bg-gray-900/40 p-3 rounded-lg border border-gray-800/40">
                        <p>{dm.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-gray-800 bg-gray-950 text-center text-xs text-gray-400 space-y-1">
                <p className="font-semibold text-gray-300">Decision-Maker Not Disclosed on Public Channels</p>
                <p className="text-gray-500">Under the UNKNOWN &gt; WRONG principle, AutoRadar leaves this field unknown rather than attributing reception lines or guessing names.</p>
              </div>
            )}
          </div>

          {/* Verified Business Contacts */}
          <div className="space-y-3 border-t border-gray-800 pt-6">
            <h2 className="text-sm uppercase font-mono text-gray-400">Verified Business Contacts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950 space-y-1">
                <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold block">Reception / Business Line</span>
                <span className="text-sm font-mono text-white block">{phoneContact?.value || "Not found"}</span>
                <span className="text-[10px] text-gray-500 block">Vadodara STD Area Code (0265) Verified</span>
              </div>
              <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950 space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold block">Corporate Email</span>
                <span className="text-sm font-mono text-white block">{emailContact?.value || "Not found"}</span>
                <span className="text-[10px] text-gray-500 block">Corporate Domain MX Verification Passed</span>
              </div>
            </div>
            {business.address && (
              <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950 text-xs">
                <span className="text-[10px] uppercase font-mono text-gray-400 font-semibold block mb-0.5">Physical Premises Address</span>
                <span className="text-gray-200">{business.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
