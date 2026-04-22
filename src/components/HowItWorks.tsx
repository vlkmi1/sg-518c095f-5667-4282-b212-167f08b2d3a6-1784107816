import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Fish, Users, Trophy, Upload, Share2, Eye, EyeOff, Target, Scale, Award, User } from "lucide-react";

export function HowItWorks() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-4xl font-bold mb-3">Jak to funguje</h2>
        <p className="text-lg text-muted-foreground">
          Vše, co potřebujete vědět o používání aplikace Ukaž Rybu
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* Přidávání úlovku */}
        <AccordionItem value="catches">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Fish className="h-5 w-5 text-primary" />
              Přidávání úlovku
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6 pt-6">
                {/* Základní postup */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                    Základní postup
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-8">
                    <li>Přihlaste se do svého profilu</li>
                    <li>Klikněte na tlačítko <strong>"Přidat úlovek"</strong></li>
                    <li>Nahrajte fotografii úlovku</li>
                    <li>Vyplňte požadované údaje</li>
                    <li>Uložte úlovek</li>
                  </ol>
                </div>

                {/* Dva režimy přidávání */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                    Dva režimy přidávání
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Rychlé přidání */}
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">Rychlé</Badge>
                        <h4 className="font-semibold">Rychlé přidání</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Ideální pro rychlé sdílení úlovku
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✅ Fotografie úlovku</li>
                        <li>✅ Druh ryby</li>
                        <li>✅ Datum a čas</li>
                        <li>❌ Míry (váha, délka)</li>
                        <li>❌ Lokace</li>
                        <li>❌ Značka nástrahy</li>
                      </ul>
                    </div>

                    {/* Detailní přidání */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-primary">Detailní</Badge>
                        <h4 className="font-semibold">Detailní přidání</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pro kompletní záznam do síně slávy
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✅ Fotografie úlovku</li>
                        <li>✅ Druh ryby</li>
                        <li>✅ Datum a čas</li>
                        <li>✅ Míry (váha, délka)</li>
                        <li>✅ Lokace (kraj, okres)</li>
                        <li>✅ Značka nástrahy</li>
                        <li>✅ Poznámky</li>
                      </ul>
                      <div className="mt-3 p-2 bg-primary/10 rounded text-xs text-primary">
                        💡 Pouze úlovky s váhou a délkou se zobrazují v síni slávy!
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI analýza */}
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    AI analýza fotografie
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aplikace automaticky analyzuje nahrané fotografie pomocí umělé inteligence:
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Rozpoznání druhu ryby</li>
                    <li>• Odhad délky a váhy</li>
                    <li>• Automatické geolokace (pokud je dostupná)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Výsledky jsou pouze orientační - vždy je zkontrolujte a upravte podle potřeby.
                  </p>
                </div>

                {/* Sdílení */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                    Sdílení úlovků
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Share2 className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Sdílet na sociálních sítích</h4>
                        <p className="text-sm text-muted-foreground">
                          Každý úlovek má tlačítko "Sdílet", které umožňuje sdílení na Facebook, Twitter nebo zkopírování odkazu.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Veřejné úlovky</h4>
                        <p className="text-sm text-muted-foreground">
                          Veřejné úlovky se zobrazují v galerii a síni slávy pro celou komunitu.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <EyeOff className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Soukromé úlovky</h4>
                        <p className="text-sm text-muted-foreground">
                          Můžete nahrávat úlovky pouze pro vlastní evidenci - ty neuvidí nikdo jiný.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Kamarádské závody */}
        <AccordionItem value="competitions">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Kamarádské závody
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6 pt-6">
                {/* Založení závodu */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                    Založení závodu
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-8">
                    <li>Klikněte na <strong>"Závody"</strong> v hlavním menu</li>
                    <li>Vyberte <strong>"Vytvořit závod"</strong></li>
                    <li>Vyplňte základní informace (název, popis, termín)</li>
                    <li>Zvolte typ hodnocení a viditelnost</li>
                    <li>Vytvořte závod a pozvedněte kamarády</li>
                  </ol>
                </div>

                {/* Typy hodnocení */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                    Typy hodnocení
                  </h3>
                  <div className="space-y-3">
                    {/* Body */}
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Hodnocení podle bodů</h4>
                        <Badge variant="secondary">Nejjednodušší</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Nastavíte bodové ohodnocení pro každý druh ryby. Například:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>Kapr</span>
                          <span className="font-bold text-primary">5 bodů</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>Štika</span>
                          <span className="font-bold text-primary">8 bodů</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>Sumec</span>
                          <span className="font-bold text-primary">10 bodů</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>Plotice</span>
                          <span className="font-bold text-primary">1 bod</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ✅ Vhodné pro: Různorodé závody, začátečníky, skupinové výlety
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ Soutěžící stačí nahrát fotku a vybrat druh - míry se nezadávají
                      </p>
                    </div>

                    {/* Váha */}
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Hodnocení podle váhy</h4>
                        <Badge variant="secondary">Klasické</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Soupeříte o nejtěžší úlovek - bez ohledu na druh ryby.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ✅ Vhodné pro: Závody na kapra, sumce, amura
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ Soutěžící musí zadat váhu v kilogramech
                      </p>
                    </div>

                    {/* Délka */}
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="h-5 w-5 text-primary rotate-90" />
                        <h4 className="font-semibold">Hodnocení podle délky</h4>
                        <Badge variant="secondary">Alternativa</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Soupeříte o nejdelší úlovek.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ✅ Vhodné pro: Závody na štiku, candáta, úhoře
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ Soutěžící musí zadat délku v centimetrech
                      </p>
                    </div>

                    {/* Kombinace */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Hodnocení podle váhy + délky</h4>
                        <Badge className="bg-primary">Nejpřesnější</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Kombinované hodnocení - započítává se jak váha, tak délka.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ✅ Vhodné pro: Profesionální závody, přesné měření
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ℹ️ Soutěžící musí zadat obě hodnoty
                      </p>
                    </div>
                  </div>
                </div>

                {/* Viditelnost */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                    Viditelnost závodu
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Veřejný */}
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Veřejný závod</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Závod je viditelný v seznamu pro všechny uživatele
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>✅ Kdokoliv může závod najít</li>
                        <li>✅ Automaticky se připojuje na základě úlovků</li>
                        <li>✅ Ideální pro komunitní soutěže</li>
                        <li>❌ Nelze omezit účastníky</li>
                      </ul>
                    </div>

                    {/* Soukromý */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <EyeOff className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Soukromý závod</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Závod je viditelný pouze pro pozvané účastníky
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>✅ Pouze pro kamarády</li>
                        <li>✅ Připojení pomocí kódu</li>
                        <li>✅ Kontrola nad účastníky</li>
                        <li>✅ Ideální pro soukromé party</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Pozvání a připojení */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                    Pozvání a připojení
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-accent/10 rounded-lg">
                      <h4 className="font-semibold mb-2">Jak pozvat kamarády (soukromý závod)</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Po vytvoření závodu získáte unikátní <strong>kód závodu</strong></li>
                        <li>Kód najdete v detailu závodu nahoře</li>
                        <li>Zkopírujte kód a pošlete kamarádům (WhatsApp, Messenger, SMS)</li>
                        <li>Kamarádi zadají kód do pole "Připojit se k závodu" na stránce Závody</li>
                      </ol>
                    </div>
                    <div className="p-4 bg-accent/10 rounded-lg">
                      <h4 className="font-semibold mb-2">Jak se připojit k závodu</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Získejte <strong>kód závodu</strong> od organizátora</li>
                        <li>Klikněte na <strong>"Závody"</strong> v menu</li>
                        <li>Klikněte na <strong>"Připojit se k závodu"</strong></li>
                        <li>Zadejte obdržený kód</li>
                        <li>Potvrďte a začněte soutěžit!</li>
                      </ol>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-primary font-semibold mb-2">💡 Tip pro organizátory:</p>
                      <p className="text-sm text-muted-foreground">
                        Udělejte screenshot kódu nebo ho pošlete do skupinového chatu, aby ho měli všichni po ruce během celého závodu.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Trofeje */}
        <AccordionItem value="trophies">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Trofeje a jejich získávání
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="border-0 shadow-none">
              <CardContent className="space-y-6 pt-6">
                {/* Co jsou trofeje */}
                <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Co jsou trofeje?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Trofeje jsou automatické ocenění za umístění v <strong>síni slávy</strong>. 
                    Získáte je za 1.–3. místo v kategorii druhu ryby na konci každého týdne, měsíce a roku.
                  </p>
                </div>

                {/* Jak funguje vyhodnocování */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                    Automatické vyhodnocování
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Týdenní</Badge>
                        <h4 className="font-semibold">Každou neděli o půlnoci</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Systém vyhodnotí síň slávy za uplynulý týden (pondělí–neděle) a udělí trofeje top 3 rybářům v každé kategorii.
                      </p>
                      <p className="text-xs text-primary mt-2">
                        Příklad: "Trofej 17. týdne v kategorii Kapr 1. místo"
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Měsíční</Badge>
                        <h4 className="font-semibold">Poslední den v měsíci o půlnoci</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Systém vyhodnotí síň slávy za celý měsíc a udělí trofeje top 3 rybářům v každé kategorii.
                      </p>
                      <p className="text-xs text-primary mt-2">
                        Příklad: "Trofej 4. měsíce v kategorii Štika 2. místo"
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary">Roční</Badge>
                        <h4 className="font-semibold">31. prosince o půlnoci</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Systém vyhodnotí síň slávy za celý rok a udělí prestižní roční trofeje top 3 rybářům v každé kategorii.
                      </p>
                      <p className="text-xs text-primary mt-2">
                        Příklad: "Trofej roku 2026 v kategorii Sumec 1. místo"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Typy pozic */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                    Trofeje podle umístění
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* 1. místo */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h4 className="font-bold text-center mb-2">1. místo</h4>
                      <p className="text-sm text-center text-muted-foreground">
                        Zlatá trofej pro nejlepšího v kategorii
                      </p>
                    </div>

                    {/* 2. místo */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h4 className="font-bold text-center mb-2">2. místo</h4>
                      <p className="text-sm text-center text-muted-foreground">
                        Stříbrná trofej pro druhého nejlepšího
                      </p>
                    </div>

                    {/* 3. místo */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                          <Trophy className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h4 className="font-bold text-center mb-2">3. místo</h4>
                      <p className="text-sm text-center text-muted-foreground">
                        Bronzová trofej pro třetího nejlepšího
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notifikace */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                    Notifikace o získání
                  </h3>
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Po přihlášení uvidíte notifikaci o všech nově získaných trofejích:
                    </p>
                    <div className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
                      <p className="text-sm font-semibold text-primary mb-1">
                        🎉 Gratulujeme! Získal jsi trofej 17. týdne v kategorii Kapr 1. místo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        8.5 kg • 75 cm
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Notifikace můžete zavřít jednotlivě nebo všechny najednou.
                    </p>
                  </div>
                </div>

                {/* Kde najít trofeje */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                    Kde najít své trofeje
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">V profilu</h4>
                        <p className="text-sm text-muted-foreground">
                          Sekce <strong>"Získané trofeje"</strong> zobrazuje všechny vaše trofeje včetně statistik (celkem, týdenní, měsíční, roční).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Statistiky</h4>
                        <p className="text-sm text-muted-foreground">
                          Nahoře v sekci trofejí vidíte rychlý přehled: celkový počet trofejí a rozpad na týdenní, měsíční a roční.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jak získat více trofejí */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Jak získat více trofejí?
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <strong>Přidávejte úlovky s přesnými mírami:</strong> Pouze úlovky s váhou a délkou se počítají do síně slávy
                    </li>
                    <li>
                      <strong>Lovte různé druhy:</strong> Každý druh ryby má vlastní kategorii - větší šance na trofej
                    </li>
                    <li>
                      <strong>Sledujte síň slávy:</strong> Podívejte se, co konkurence chytá a zkuste je překonat
                    </li>
                    <li>
                      <strong>Buďte konzistentní:</strong> Týdenní trofeje jsou nejdostupnější - chyťte si jednu každý týden!
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Pricing Section */}
        <AccordionItem value="pricing" className="border-l-4 border-l-primary/30">
          <AccordionTrigger className="hover:no-underline px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold text-left">
                💰 Kolik stojí ukažrybu.cz?
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-primary">
                    0 Kč
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    Nic, aplikace a její užívání je zcela ZDARMA!
                  </p>
                  <div className="space-y-2 text-left max-w-lg mx-auto pt-4">
                    <div className="flex items-start gap-3">
                      <span className="text-primary text-xl">✓</span>
                      <span className="text-muted-foreground">
                        Vystavování úlovků bez omezení
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary text-xl">✓</span>
                      <span className="text-muted-foreground">
                        Kamarádské závody a jejich funkce
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary text-xl">✓</span>
                      <span className="text-muted-foreground">
                        Získávání trofejí a statistik
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary text-xl">✓</span>
                      <span className="text-muted-foreground">
                        Síň slávy a žebříčky
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary text-xl">✓</span>
                      <span className="text-muted-foreground">
                        Vše pro rybáře zcela zdarma
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic pt-4">
                    Naším cílem je vytvořit komunitu rybářů, kde se každý může svobodně sdílet a soutěžit.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}