import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileView } from "@/components/profile/ProfileView";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <ProfileView />
      </div>
    </ProtectedRoute>
  );
}