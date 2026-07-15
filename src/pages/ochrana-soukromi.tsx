import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Trash2, Mail, Cookie } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="Ochrana soukromí - Ukaž Rybu"
        description="Zásady ochrany osobních údajů a GDPR pro aplikaci Ukaž Rybu"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <main className="container max-w-4xl mx-auto px-4 py-16">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Ochrana soukromí</h1>
            <p className="text-muted-foreground text-lg">
              Poslední aktualizace: 15. července 2026
            </p>
          </div>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                1. Úvod
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Vítejte na platformě <strong className="text-foreground">Ukaž Rybu</strong> (dále jen "Služba"). Ochrana vašich osobních údajů je pro nás prioritou. Tento dokument popisuje, jaké údaje sbíráme, jak je používáme a jaká máte práva.
              </p>
              <p>
                Provozovatelem služby je <strong className="text-foreground">Ukaž Rybu</strong>, se sídlem v České republice.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                2. Jaké údaje sbíráme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">2.1 Údaje při registraci</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-foreground">Email:</strong> Pro přihlášení a komunikaci</li>
                  <li><strong className="text-foreground">Nick (přezdívka):</strong> Vaše veřejná identita na platformě</li>
                  <li><strong className="text-foreground">Heslo:</strong> Uloženo v šifrované podobě</li>
                  <li><strong className="text-foreground">Profilová fotka:</strong> Volitelná</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">2.2 Údaje o úlovcích</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-foreground">Fotografie:</strong> Obrázky nahraných úlovků</li>
                  <li><strong className="text-foreground">Metadata:</strong> Druh ryby, rozměry, váha, datum, čas, místo úlovku</li>
                  <li><strong className="text-foreground">Geolokace:</strong> GPS souřadnice (pokud je poskytnete)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">2.3 Technické údaje</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-foreground">IP adresa:</strong> Pro zabezpečení a analytics</li>
                  <li><strong className="text-foreground">Typ zařízení a prohlížeč:</strong> Pro optimalizaci služby</li>
                  <li><strong className="text-foreground">Cookies:</strong> Pro funkčnost a preferenci uživatele</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                3. Jak údaje používáme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Vaše osobní údaje používáme výhradně pro:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Provoz služby:</strong> Autentizace, zobrazení profilu a úlovků</li>
                <li><strong className="text-foreground">Komunikace:</strong> Zasílání oznámení o aktivitě, novinkách a aktualizacích</li>
                <li><strong className="text-foreground">Zlepšení služby:</strong> Analýza používání pro vylepšení funkcí</li>
                <li><strong className="text-foreground">Závody a soutěže:</strong> Organizace a vyhodnocení rybářských soutěží</li>
                <li><strong className="text-foreground">Síň slávy:</strong> Veřejné zobrazení nejlepších úlovků</li>
                <li><strong className="text-foreground">Zabezpečení:</strong> Ochrana před zneužitím a podvody</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                4. Sdílení údajů
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Vaše osobní údaje neprodáváme ani nepronajímáme třetím stranám.</p>
              <p>Údaje sdílíme pouze v těchto případech:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Veřejná galerie:</strong> Fotky úlovků, nick, základní údaje o úlovku jsou veřejně viditelné</li>
                <li><strong className="text-foreground">Poskytovatelé služeb:</strong> Supabase (hosting databáze), OpenAI (AI analýza ryb)</li>
                <li><strong className="text-foreground">Právní požadavky:</strong> Pokud to vyžaduje zákon nebo soudní příkaz</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                5. Zabezpečení údajů
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Používáme moderní bezpečnostní opatření pro ochranu vašich údajů:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">HTTPS šifrování:</strong> Veškerá komunikace je šifrována</li>
                <li><strong className="text-foreground">Hashovaná hesla:</strong> Hesla ukládáme v nečitelné podobě</li>
                <li><strong className="text-foreground">Row Level Security (RLS):</strong> Přístup k datům jen pro oprávněné uživatele</li>
                <li><strong className="text-foreground">Pravidelné zálohy:</strong> Ochrana před ztrátou dat</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                6. Vaše práva (GDPR)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Podle GDPR máte následující práva:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Právo na přístup:</strong> Vyžádat kopii všech vašich údajů</li>
                <li><strong className="text-foreground">Právo na opravu:</strong> Opravit nesprávné údaje</li>
                <li><strong className="text-foreground">Právo na výmaz:</strong> Smazání vašeho účtu a údajů</li>
                <li><strong className="text-foreground">Právo na přenositelnost:</strong> Export dat ve strojově čitelném formátu</li>
                <li><strong className="text-foreground">Právo na omezení zpracování:</strong> Pozastavení zpracování</li>
                <li><strong className="text-foreground">Právo vznést námitku:</strong> Nesouhlasit se zpracováním</li>
              </ul>
              <p className="mt-4">
                Pro uplatnění vašich práv nás kontaktujte na emailu uvedeném níže.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                7. Uchovávání a mazání údajů
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Vaše údaje uchováváme po dobu, kdy je váš účet aktivní. Po smazání účtu:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Osobní údaje:</strong> Smažeme do 30 dnů</li>
                <li><strong className="text-foreground">Veřejné úlovky:</strong> Můžeme ponechat anonymizované pro zachování integrity závodů a Síně slávy</li>
                <li><strong className="text-foreground">Technické logy:</strong> Smažeme do 90 dnů</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                8. Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Používáme následující typy cookies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Nezbytné:</strong> Pro funkčnost přihlášení a zabezpečení</li>
                <li><strong className="text-foreground">Preferenční:</strong> Pro uložení vašich nastavení (jazyk, téma)</li>
                <li><strong className="text-foreground">Analytické:</strong> Pro zlepšení služby (anonymizované)</li>
              </ul>
              <p className="mt-4">
                Cookies můžete spravovat v nastavení vašeho prohlížeče.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                9. Kontakt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Máte-li dotazy ohledně ochrany osobních údajů, kontaktujte nás:
              </p>
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p><strong className="text-foreground">Email:</strong> info@ukažrybu.cz</p>
                <p><strong className="text-foreground">Kontaktní formulář:</strong> <Link href="/#contact" className="text-primary hover:underline">ukažrybu.cz/#contact</Link></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle>10. Změny v ochraně soukromí</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Tyto zásady můžeme aktualizovat. O významných změnách vás budeme informovat emailem nebo oznámením v aplikaci. Doporučujeme pravidelně kontrolovat tuto stránku pro aktuální informace.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}