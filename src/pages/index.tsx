import { SEO } from "@/components/SEO";
import { CatchGallery } from "@/components/gallery/CatchGallery";
import { ContactForm } from "@/components/ContactForm";
import { HowItWorks } from "@/components/HowItWorks";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Camera, Users, Fish } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        description="Sdílej své úlovky s komunitou rybářů. Soutěž v závodech. Najdi inspiraci. A ano, je to ZDARMA!"
        url="https://ukazrybu.cz"
        noindex={false}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Ukaž Rybu
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sdílej své úlovky s komunitou rybářů. Soutěž v závodech. Najdi inspiraci.
              <span className="block mt-2 font-semibold text-primary">A ano, je to ZDARMA!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <>
                  <Link href="/profile/add-catch">
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      <Camera className="h-5 w-5" />
                      Přidat úlovek
                    </Button>
                  </Link>
                  <Link href="/competitions">
                    <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                      <Trophy className="h-5 w-5" />
                      Závody
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      Začít
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                      Přihlásit se
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center p-6 rounded-lg bg-card border">
                <Camera className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Sdílej úlovky</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Nahraj fotku a ukaž své úlovky komunitě
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 rounded-lg bg-card border">
                <Trophy className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Závoď a vyhrávej</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Účastni se závodů a soupeř s ostatními
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 rounded-lg bg-card border">
                <Fish className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-semibold mb-2">AI rozpoznání</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Automatické určení druhu a rozměrů ryby
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
                Nejnovější úlovky
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Prozkoumej galerii úlovků od rybářů z celé České republiky
              </p>
            </div>
            <CatchGallery />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
                Kontaktuj nás
              </h2>
              <p className="text-muted-foreground">
                Máš otázky nebo návrhy? Napiš nám
              </p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}