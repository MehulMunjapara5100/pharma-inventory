import { PageHeader } from "@/components/UI";
import { getAuthFromCookies } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";

export default function SettingsPage() {
  const me = getAuthFromCookies();
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile and pharmacy preferences." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1">
          <h3 className="font-semibold text-ink-900 mb-4">Profile</h3>
          <div className="space-y-3 text-sm">
            <Row k="Name" v={me?.name || ""} />
            <Row k="Email" v={me?.email || ""} />
            <Row k="Role" v={ROLE_LABEL[me!.role]} />
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-ink-900 mb-4">Pharmacy preferences</h3>
          <p className="text-sm text-ink-500 mb-4">Settings here apply across the workspace.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Pharmacy name"><input className="input" defaultValue="Smience Life Science" /></Field>
            <Field label="Currency"><select className="input" defaultValue="USD"><option>USD</option><option>INR</option><option>EUR</option></select></Field>
            <Field label="Low-stock alert threshold"><input className="input" defaultValue="10" /></Field>
            <Field label="Near-expiry window (days)"><input className="input" defaultValue="30" /></Field>
          </div>
          <p className="text-xs text-ink-400 mt-3">These preferences are stored locally for demo. Connect the API endpoint to persist them.</p>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{k}</span>
      <span className="font-medium text-ink-900">{v}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
