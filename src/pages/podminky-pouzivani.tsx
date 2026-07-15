import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, AlertCircle, Scale, UserX, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <>
      <SEO
        title="Podmínky použití - Ukaž Rybu"
        description="Všeobecné obchodní podmínky a pravidla používání aplikace Ukaž Rybu"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
        <main className="container max-w-4xl mx-auto px-4 py-16">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <FileText className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Podmínky použití</h1>
            <p className="text-muted-foreground text-lg">
              Poslední aktualizace: 15. července 2026
            </p>
          </div>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                1. Všeobecná ustanovení
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Tyto podmínky použití (dále jen "Podmínky") upravují vztah mezi provozovatelem platformy <strong className="text-foreground">Ukaž Rybu</strong> (dále jen "Provozovatel" nebo "my") a uživateli služby (dále jen "Uživatel" nebo "vy").
              </p>
              <p>
                Používáním našich služeb vyjadřujete souhlas s těmito Podmínkami. Pokud s nimi nesouhlasíte, službu nepoužívejte.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                2. Popis služby
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Ukaž Rybu</strong> je platforma pro rybáře, která umožňuje:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sdílení fotografií rybářských úlovků</li>
                <li>Automatické rozpoznání druhu ryby a odhad rozměrů pomocí AI</li>
                <li>Vytváření a účast v rybářských závodech a soutěžích</li>
                <li>Zobrazení v Síni slávy pro nejlepší úlovky</li>
                <li>Sledování vlastních statistik a úlovků</li>
                <li>Komunikaci s komunitou rybářů</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-accent" />
                3. Registrace a účet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">3.1 Podmínky registrace</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Musíte být starší 13 let</li>
                  <li>Jeden uživatel může mít pouze jeden účet</li>
                  <li>Musíte poskytnout pravdivé a aktuální údaje</li>
                  <li>Jste odpovědní za zabezpečení svého hesla</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">3.2 Nick (přezdívka)</h3>
                <p>
                  Váš nick musí být jedinečný a nesmí:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Porušovat práva třetích stran</li>
                  <li>Být urážlivý nebo obscénní</li>
                  <li>Napodobovat jinou osobu nebo organizaci</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                4. Pravidla používání
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  4.1 Povolené použití
                </h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Nahrávání fotografií vlastních úlovků</li>
                  <li>Účast v rybářských závodech</li>
                  <li>Sdílení zkušeností a rad s komunitou</li>
                  <li>Používání AI analýzy pro identifikaci ryb</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  4.2 Zakázané použití
                </h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-foreground">Podvodné úlovky:</strong> Nahrávání cizích fotografií, falšování údajů</li>
                  <li><strong className="text-foreground">Spam:</strong> Hromadné zasílání zpráv, reklamy</li>
                  <li><strong className="text-foreground">Nelegální obsah:</strong> Porušování zákonů o rybolovu</li>
                  <li><strong className="text-foreground">Obtěžování:</strong> Urážky, hrozby, kyberšikana</li>
                  <li><strong className="text-foreground">Technické zneužití:</strong> Hackování, DOS útoky, scraping</li>
                  <li><strong className="text-foreground">Nevhodný obsah:</strong> Nahota, násilí, nenávistné projevy</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-accent" />
                5. Obsah a autorská práva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">5.1 Váš obsah</h3>
                <p>
                  Nahráním fotografie nebo jiného obsahu:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Potvrzujete, že máte právo tento obsah sdílet</li>
                  <li>Udělujete nám licenci k zobrazení a zpracování tohoto obsahu</li>
                  <li>Souhlasíte s veřejným zobrazením v galerii a Síni slávy</li>
                  <li>Zachováváte si vlastnická práva ke svému obsahu</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">5.2 Naše práva</h3>
                <p>
                  Veškerý obsah platformy (design, kód, loga, AI modely) je chráněn autorským právem. Nesmíte:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Kopírovat nebo napodobovat design platformy</li>
                  <li>Stahovat hromadně data jiných uživatelů</li>
                  <li>Používat naše loga nebo značky bez souhlasu</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                6. Závody a soutěže
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">6.1 Fair play</h3>
                <p>Účastí v závodech se zavazujete:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Nahrávat pouze vlastní úlovky pořízené během závodu</li>
                  <li>Poskytovat pravdivé údaje o rozměrech a čase úlovku</li>
                  <li>Dodržovat pravidla stanovená pořadatelem závodu</li>
                  <li>Respektovat rybářské zákony a vyhlášky</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">6.2 Podvádění</h3>
                <p>
                  Podvodné jednání (falšování fotek, údajů, více účtů) vede k:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Okamžité diskvalifikaci ze závodu</li>
                  <li>Trvalému zákazu účasti v závodech</li>
                  <li>Možnému zablokování účtu</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-accent" />
                7. Odpovědnost a omezení
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">7.1 Provoz služby</h3>
                <p>
                  Službu poskytujeme "tak jak je" (AS IS). Neposkytujeme záruky:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Nepřetržitého provozu bez výpadků</li>
                  <li>Přesnosti AI rozpoznávání ryb</li>
                  <li>Bezchybnosti služby</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">7.2 Omezení odpovědnosti</h3>
                <p>Neneseme odpovědnost za:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ztrátu dat v důsledku technických problémů</li>
                  <li>Obsah sdílený jinými uživateli</li>
                  <li>Škody způsobené porušením těchto Podmínek</li>
                  <li>Následky nedodržení rybářských zákonů</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">7.3 Vaše odpovědnost</h3>
                <p>
                  Jste plně odpovědní za:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Obsah, který sdílíte</li>
                  <li>Dodržování rybářských zákonů a vyhlášek</li>
                  <li>Své jednání vůči jiným uživatelům</li>
                  <li>Zabezpečení svého účtu</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-accent" />
                8. Ukončení účtu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold mb-2 text-foreground">8.1 Vaše právo</h3>
                <p>
                  Můžete kdykoliv smazat svůj účet v nastavení profilu.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-foreground">8.2 Naše právo</h3>
                <p>
                  Můžeme pozastavit nebo trvale zablokovat váš účet při:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Porušení těchto Podmínek</li>
                  <li>Podvodném jednání</li>
                  <li>Obtěžování jiných uživatelů</li>
                  <li>Technickém zneužití služby</li>
                  <li>Opakovaném sdílení nevhodného obsahu</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent/20">
            <CardHeader>
              <CardTitle>9. Změny podmínek</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Vyhrazujeme si právo tyto Podmínky kdykoli změnit. O významných změnách vás budeme informovat:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Emailem na vaši registrovanou adresu</li>
                <li>Oznámením v aplikaci</li>
                <li>Aktualizací data na této stránce</li>
              </ul>
              <p className="mt-4">
                Pokračováním v používání služby po změně podmínek vyjadřujete souhlas s aktualizovanými Podmínkami.
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle>10. Kontakt a řešení sporů</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Máte-li dotazy nebo stížnosti:
              </p>
              <div className="bg-accent/5 p-4 rounded-lg mt-4">
                <p><strong className="text-foreground">Email:</strong> info@ukažrybu.cz</p>
                <p><strong className="text-foreground">Kontaktní formulář:</strong> <Link href="/#contact" className="text-accent hover:underline">ukažrybu.cz/#contact</Link></p>
              </div>
              <p className="mt-4">
                Tyto Podmínky se řídí právním řádem České republiky. Případné spory budou řešeny u místně a věcně příslušných soudů ČR.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}