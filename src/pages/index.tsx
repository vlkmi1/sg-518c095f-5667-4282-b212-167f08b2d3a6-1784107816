import { Header } from "@/components/layout/Header";
import { CatchGallery } from "@/components/gallery/CatchGallery";
import { HallOfFame } from "@/components/gallery/HallOfFame";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO 
        title="Ukaž Rybu - Sdílej své rybářské úlovky"
        description="Ukažte své úlovky komunitě rybářů! Fotogalerie, statistiky, závody a AI rozpoznávání druhů ryb."
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