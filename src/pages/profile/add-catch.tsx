import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UploadCatchForm } from "@/components/profile/UploadCatchForm";

export default function AddCatchPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <UploadCatchForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}