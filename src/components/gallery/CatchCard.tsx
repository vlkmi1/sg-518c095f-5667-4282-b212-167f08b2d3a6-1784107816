import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CatchWithProfile } from "@/services/catchService";
import { MapPin, Calendar, Ruler, Weight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface CatchCardProps {
  catch: CatchWithProfile;
}

export function CatchCard({ catch: catchData }: CatchCardProps) {
  const caughtDate = catchData.caught_at ? new Date(catchData.caught_at) : null;

  return (
    <Link href={`/catches/${catchData.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {catchData.photo_url ? (
            <img
              src={catchData.photo_url}
              alt={`${catchData.species || "Ryba"} - úlovek`}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Bez fotografie
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Species & Angler */}
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-foreground leading-tight">
              {catchData.species || "Neznámý druh"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {catchData.profiles?.nickname || "Anonym"}
            </p>
          </div>

          {/* Measurements */}
          <div className="flex flex-wrap gap-2">
            {catchData.length_cm && (
              <Badge variant="secondary" className="gap-1">
                <Ruler className="h-3 w-3" />
                {catchData.length_cm} cm
              </Badge>
            )}
            {catchData.weight_kg && (
              <Badge variant="secondary" className="gap-1">
                <Weight className="h-3 w-3" />
                {catchData.weight_kg} kg
              </Badge>
            )}
          </div>

          {/* Location & Date */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {catchData.country && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {[catchData.district, catchData.region, catchData.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {caughtDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  {format(caughtDate, "d. MMMM yyyy, HH:mm", { locale: cs })}
                </span>
              </div>
            )}
          </div>

          {/* Bait */}
          {catchData.bait_brand && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Nástraha: <span className="text-foreground font-medium">{catchData.bait_brand}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}