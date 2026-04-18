import { Header } from "@/components/layout/Header";
import { CatchGallery } from "@/components/gallery/CatchGallery";
import { Button } from "@/components/ui/button";
import { Fish, MapPin, Calendar, Ruler } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            Sdílejte své úlovky<br />s komunitou rybářů
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Veřejná galerie fotografií úlovků s detailními informacemi o druhu, míře a místě úlovku
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                Začít sdílet
              </Button>
            </Link>
            <a href="#gallery">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Prohlédnout galerii
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-12">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Fish className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Detailní info</h3>
              <p className="text-sm text-muted-foreground">
                Druh, míry, čas a značka nástrahy
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Geolokace</h3>
              <p className="text-sm text-muted-foreground">
                Automatické uložení místa úlovku
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-serif text-lg font-semibold">Historie</h3>
              <p className="text-sm text-muted-foreground">
                Přehled všech vašich úlovků
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ruler className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold">AI analýza</h3>
              <p className="text-sm text-muted-foreground">
                Rozpoznání druhu a odhad rozměrů
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-8">
        <div className="container mb-6">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center">
            Nejnovější úlovky
          </h2>
        </div>
        <CatchGallery />
      </section>
    </div>
  );
}