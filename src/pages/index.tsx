import { CatchGallery } from "@/components/gallery/CatchGallery";
import { HallOfFame } from "@/components/gallery/HallOfFame";
import { HowItWorks } from "@/components/HowItWorks";
import { ContactForm } from "@/components/ContactForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background z-10" />
        <div className="absolute inset-0">
          <img
            src="/hero-fishing.jpg"
            alt="Rybářství"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Ukaž Rybu
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow">
            Sdílej své úlovky s komunitou rybářů
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12">
        <CatchGallery />
      </section>

      {/* Hall of Fame Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <HallOfFame />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <HowItWorks />
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-4xl font-bold text-center mb-8">
              Kontaktujte nás
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}