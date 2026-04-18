import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateCompetitionForm } from "@/components/competitions/CreateCompetitionForm";

export default function CreateCompetitionPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 sm:py-12">
          <CreateCompetitionForm />
        </main>
      </div>
    </ProtectedRoute>
  );
}