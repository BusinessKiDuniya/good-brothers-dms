import AuthPanel from "@/components/auth/auth-panel";
import { ImpactPanel } from "@/components/auth/impact-panel";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-0 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-none bg-white shadow-xl lg:grid-cols-2 lg:rounded-3xl">
        <ImpactPanel />

        <div className="flex items-center justify-center p-5 sm:p-10">
          <AuthPanel />
        </div>
      </div>
    </main>
  );
}
