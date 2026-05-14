import { RegisterForm } from "@/components/auth/RegisterForm";
import { SEO } from "@/components/SEO";
import { Fish } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <SEO
        title="Registrace - Ukaž Rybu"
        description="Zaregistruj se zdarma a sdílej své úlovky s komunitou rybářů"
        url="https://ukazrybu.cz/auth/register"
        noindex={false}
      />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Link href="/" className="flex items-center space-x-2 mb-8 hover:opacity-80 transition-opacity">
          <Fish className="h-8 w-8 text-primary" />
          <span className="font-serif text-3xl font-bold text-primary">Úlovky</span>
        </Link>
        <RegisterForm />
      </div>
    </>
  );
}