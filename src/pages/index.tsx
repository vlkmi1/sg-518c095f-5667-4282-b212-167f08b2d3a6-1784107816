import { Header } from "@/components/layout/Header";
import { CatchGallery } from "@/components/gallery/CatchGallery";
import { HallOfFame } from "@/components/gallery/HallOfFame";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO 
        title="Úlovky - Rybářský portál pro sdílení úlovků"
        description="Sdílejte své rybářské úlovky s komunitou. Galerie fotografií, statistiky a závody mezi rybáři."
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <CatchGallery />
          
          {/* Hall of Fame */}
          <div className="border-t border-border/40 bg-muted/30">
            <div className="container py-12">
              <HallOfFame />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}