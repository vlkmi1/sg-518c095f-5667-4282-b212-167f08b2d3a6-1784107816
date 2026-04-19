import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

export function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        title: "Vyplňte všechna pole",
        description: "Prosím vyplňte jméno, email a zprávu",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Neplatný email",
        description: "Prosím zadejte platnou emailovou adresu",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nepodařilo se odeslat zprávu");
      }

      toast({
        title: "✅ Zpráva odeslána!",
        description: "Děkujeme za váš návrh. Brzy se vám ozveme na email.",
      });

      // Reset form
      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odeslat zprávu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl">
              Návrhy na vylepšení
            </CardTitle>
            <CardDescription className="text-base">
              Kontaktujte nás s vašimi nápady a zpětnou vazbou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Jméno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Vaše jméno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Váš návrh nebo zpětná vazba <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Popište váš návrh na vylepšení nebo sdílejte vaši zpětnou vazbu..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                  rows={6}
                  required
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Odesílám...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Odeslat zprávu
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Odpovíme vám co nejdříve na poskytnutý email.
          </p>
          <p className="mt-2">
            Vaše zprávy nám pomáhají vylepšovat Ukaž Rybu pro celou komunitu. 🎣
          </p>
        </div>
      </div>
    </section>
  );
}