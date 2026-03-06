import { AppShell } from "@/components/shell/app-shell";

export default function LocalePage() {
  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to Evidoxa</p>
      </div>
    </AppShell>
  );
}
