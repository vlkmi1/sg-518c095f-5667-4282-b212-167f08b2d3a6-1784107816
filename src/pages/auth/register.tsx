import { RegisterForm } from "@/components/auth/RegisterForm";
import { Fish } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center space-x-2 mb-8 hover:opacity-80 transition-opacity">
        <Fish className="h-8 w-8 text-primary" />
        <span className="font-serif text-3xl font-bold text-primary">Úlovky</span>
      </Link>
      <RegisterForm />
    </div>
  );
}