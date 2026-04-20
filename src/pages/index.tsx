import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/Header";
import { CatchGallery } from "@/components/gallery/CatchGallery";
import { ContactForm } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Camera, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dynamic from "next/dynamic";

// Dynamic import to avoid hydration issues with async data loading
const HallOfFame = dynamic(
  () => import("@/components/gallery/HallOfFame").then((mod) => ({ default: mod.HallOfFame })),
  { ssr: false }
);

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <SEO 
        title="Ukaž Rybu - Sdílej své úlovky s komunitou rybářů"
        description="Platforma pro rybáře k přehlednému sdílení fotografií úlovků. Veřejná galerie, rybářské závody a komunita."
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero-fishing.jpg"
              alt="Rybářské pruty u jezera při západu slunce"
              className="w-full h-full object-cover"
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 container px-4 text-center">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 drop-shadow-lg">
              Ukaž Rybu
            </h1>
            <p className="text-lg sm:text-xl text-foreground/90 mb-2 max-w-2xl mx-auto drop-shadow">
              Sdílej své úlovky s komunitou rybářů. Soutěž v závodech. Najdi inspiraci.
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-8 drop-shadow-lg">
              A ano, je to ZDARMA!
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2 shadow-lg w-full sm:w-auto">
                  <Camera className="h-5 w-5" />
                  Přidat úlovek
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href={isAuthenticated ? "/competitions" : "/auth/register"}>
                <Button size="lg" variant="outline" className="gap-2 bg-background/80 backdrop-blur w-full sm:w-auto" suppressHydrationWarning>
                  <Trophy className="h-5 w-5" />
                  {isAuthenticated ? "Zobrazit závody" : "Připojit se k závodům"}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center mt-12 text-sm">
              <div className="flex items-center gap-2 text-foreground/80">
                <Users className="h-5 w-5 text-primary" />
                <span>Aktivní komunita rybářů</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <Trophy className="h-5 w-5 text-primary" />
                <span>Rybářské závody</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <Camera className="h-5 w-5 text-primary" />
                <span>Galerie úlovků</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - Gallery */}
        <main className="container py-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold mb-2">Nedávné úlovky</h2>
            <p className="text-muted-foreground">Prohlédněte si nejnovější úlovky z komunity</p>
          </div>
          <CatchGallery />
        </main>

        {/* Hall of Fame */}
        <section className="container py-12">
          <HallOfFame />
        </section>

        {/* Contact Form */}
        <ContactForm />
      </div>
    </>
  );
}