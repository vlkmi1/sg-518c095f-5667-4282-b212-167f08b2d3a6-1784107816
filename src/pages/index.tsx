import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/Header";
import { CatchGallery } from "@/components/gallery/CatchGallery";
import { ContactForm } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Camera, Users } from "lucide-react";
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
        url="https://ukaz-rybu.vercel.app"
        noindex={false}
      />
    </>
  );
}