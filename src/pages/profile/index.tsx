import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileView } from "@/components/profile/ProfileView";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <ProfileView />
      </div>
    </ProtectedRoute>
  );
}