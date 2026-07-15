import { SEO } from "@/components/SEO";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HallOfFame } from "@/components/gallery/HallOfFame";
import { HowItWorks } from "@/components/HowItWorks";
import { ContactForm } from "@/components/ContactForm";

export default function HomePage() {
  return (
    <>
      <SEO />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <Header />
        <main>
          {/* Síň slávy jako první sekce */}
          <section className="py-16">
            <HallOfFame />
          </section>

          {/* Jak to funguje */}
          <section id="how-it-works" className="py-16 bg-muted/30">
            <HowItWorks />
          </section>

          {/* Kontaktní formulář */}
          <section id="contact" className="py-16">
            <div className="container max-w-2xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="font-serif text-4xl md:text-5xl mb-4">
                  Kontakt
                </h2>
                <p className="text-muted-foreground text-lg">
                  Máte dotaz nebo nápad? Napište nám!
                </p>
              </div>
              <ContactForm />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}