import { prisma } from "@/lib/db";

// Admin-only, session-gated data — never worth prerendering or caching,
// and this also skips Next's build-time static-optimization trial render
// (which would otherwise hit the DB during `next build`).
export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function IntegrationRow({ name, configured, envVar }: { name: string; configured: boolean; envVar: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-900">{name}</div>
        <div className="text-xs text-slate-500">{envVar}</div>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          configured ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}
      >
        {configured ? "Configured" : "Not configured"}
      </span>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [userCount, adminCount, verifiedCount, disabledCount, analysisCount, analysesByType] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { disabledAt: { not: null } } }),
    prisma.savedAnalysis.count(),
    prisma.savedAnalysis.groupBy({ by: ["propertyType"], _count: true }),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Account, content, and integration status at a glance.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Users" value={userCount} />
        <StatCard label="Admins" value={adminCount} />
        <StatCard label="Verified" value={verifiedCount} />
        <StatCard label="Disabled" value={disabledCount} />
        <StatCard label="Saved analyses" value={analysisCount} />
      </div>

      {analysesByType.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Saved analyses by type
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            {analysesByType.map((row) => (
              <div key={row.propertyType} className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{row._count}</span> {row.propertyType}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-1 text-sm font-bold text-slate-900">Integrations</div>
        <p className="mb-3 text-xs text-slate-500">
          These are configured via environment variables, not from this panel — see the README and{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">.env.example</code>. This is a read-only status
          check.
        </p>
        <IntegrationRow
          name="RentCast (MLS/comps lookup)"
          envVar="RENTCAST_API_KEY"
          configured={!!process.env.RENTCAST_API_KEY}
        />
        <IntegrationRow
          name="SMTP (real email delivery)"
          envVar="SMTP_HOST"
          configured={!!process.env.SMTP_HOST}
        />
      </div>
    </div>
  );
}
