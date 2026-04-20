import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CatchWithProfile } from "@/services/catchService";
import { MapPin, Calendar, Ruler, Weight } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useState } from "react";

interface CatchCardProps {
  catch: CatchWithProfile;
}

export function CatchCard({ catch: catchData }: CatchCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const caughtDate = catchData.caught_at ? new Date(catchData.caught_at) : null;

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
        onClick={() => setIsOpen(true)}
      >
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

        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Species & Angler */}
          <div className="space-y-1">
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground leading-tight">
              {catchData.species || "Neznámý druh"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {catchData.profiles?.nickname || "Anonym"}
            </p>
          </div>

          {/* Measurements */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {catchData.length_cm && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Ruler className="h-3 w-3" />
                {catchData.length_cm} cm
              </Badge>
            )}
            {catchData.weight_kg && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Weight className="h-3 w-3" />
                {catchData.weight_kg} kg
              </Badge>
            )}
          </div>

          {/* Location & Date */}
          <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            {catchData.country && (
              <div className="flex items-start gap-1.5 sm:gap-2">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">
                  {[catchData.district, catchData.region, catchData.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {caughtDate && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {format(caughtDate, "d. MMMM yyyy, HH:mm", { locale: cs })}
                </span>
              </div>
            )}
          </div>

          {/* Bait */}
          {catchData.bait_brand && (
            <div className="pt-1.5 sm:pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground truncate">
                Nástraha: <span className="text-foreground font-medium">{catchData.bait_brand}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {catchData.species || "Neznámý druh"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Large Photo */}
            {catchData.photo_url ? (
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                <img
                  src={catchData.photo_url}
                  alt={`${catchData.species || "Ryba"} - úlovek`}
                  className="object-contain w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                Bez fotografie
              </div>
            )}

            {/* Details */}
            <div className="space-y-3">
              {/* Angler */}
              <div>
                <p className="text-sm text-muted-foreground">Rybář</p>
                <p className="font-medium">{catchData.profiles?.nickname || "Anonym"}</p>
              </div>

              {/* Measurements */}
              {(catchData.length_cm || catchData.weight_kg) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Rozměry</p>
                  <div className="flex flex-wrap gap-2">
                    {catchData.length_cm && (
                      <Badge variant="secondary" className="gap-1">
                        <Ruler className="h-4 w-4" />
                        {catchData.length_cm} cm
                      </Badge>
                    )}
                    {catchData.weight_kg && (
                      <Badge variant="secondary" className="gap-1">
                        <Weight className="h-4 w-4" />
                        {catchData.weight_kg} kg
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {catchData.country && (
                <div>
                  <p className="text-sm text-muted-foreground">Místo</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium">
                      {[catchData.district, catchData.region, catchData.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              {caughtDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Datum a čas</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {format(caughtDate, "d. MMMM yyyy, HH:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
              )}

              {/* Bait */}
              {catchData.bait_brand && (
                <div>
                  <p className="text-sm text-muted-foreground">Nástraha</p>
                  <p className="font-medium">{catchData.bait_brand}</p>
                </div>
              )}

              {/* Notes */}
              {catchData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Poznámky</p>
                  <p className="font-medium">{catchData.notes}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}