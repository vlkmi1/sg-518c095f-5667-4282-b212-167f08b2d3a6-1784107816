import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, Clock } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useState } from "react";

interface TimelineCatch {
  id: string;
  photo_url: string;
  species: string;
  length_cm?: number | null;
  weight_kg?: number | null;
  caught_at: string;
  created_at: string;
  user_id: string;
  profiles?: {
    nickname?: string;
    avatar_url?: string;
  };
}

interface CompetitionTimelineProps {
  catches: TimelineCatch[];
  participants: any[];
  scoringType: "points" | "measurements";
  measurementType?: "weight" | "length" | "both" | null;
  fishPoints?: Record<string, number> | null;
  minWeightKg?: number | null;
}

export function CompetitionTimeline({
  catches,
  participants,
  scoringType,
  measurementType,
  fishPoints,
  minWeightKg,
}: CompetitionTimelineProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  function calculateCatchScore(catchData: TimelineCatch): number {
    if (scoringType === "points") {
      const fishPointsConfig = fishPoints || {};
      return fishPointsConfig[catchData.species] || 1;
    } else {
      const type = measurementType || "both";
      
      if (type === "weight") {
        return catchData.weight_kg || 0;
      } else if (type === "length") {
        return catchData.length_cm || 0;
      } else {
        const lengthScore = catchData.length_cm || 0;
        const weightScore = (catchData.weight_kg || 0) * 10;
        return lengthScore + weightScore;
      }
    }
  }

  function meetsMinWeight(catchData: TimelineCatch): boolean {
    if (!minWeightKg) return true;
    return (catchData.weight_kg || 0) >= minWeightKg;
  }

  // Group catches by date
  const catchesByDate = catches.reduce((acc, catchData) => {
    const date = format(new Date(catchData.caught_at || catchData.created_at), "d. MMMM yyyy", { locale: cs });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(catchData);
    return acc;
  }, {} as Record<string, TimelineCatch[]>);

  const sortedDates = Object.keys(catchesByDate).sort((a, b) => {
    const dateA = new Date(catchesByDate[a][0].caught_at || catchesByDate[a][0].created_at);
    const dateB = new Date(catchesByDate[b][0].caught_at || catchesByDate[b][0].created_at);
    return dateB.getTime() - dateA.getTime();
  });

  if (catches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Časová osa úlovků
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Zatím nejsou žádné úlovky</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Zvětšený úlovek"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="font-serif text-lg sm:text-xl flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Časová osa úlovků
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 sm:space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-2 sm:space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="outline" className="font-medium text-xs">
                    {date}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Catches for this date */}
                <div className="space-y-2 sm:space-y-3 relative pl-4 sm:pl-6">
                  {/* Vertical line */}
                  <div className="absolute left-1.5 sm:left-2 top-0 bottom-0 w-0.5 bg-primary/20" />

                  {catchesByDate[date]
                    .sort((a, b) => {
                      const timeA = new Date(a.caught_at || a.created_at).getTime();
                      const timeB = new Date(b.caught_at || b.created_at).getTime();
                      return timeB - timeA;
                    })
                    .map((catchData, index) => {
                      const participant = participants.find((p) => p.user_id === catchData.user_id);
                      const score = calculateCatchScore(catchData);
                      const isValid = meetsMinWeight(catchData);
                      
                      return (
                        <div key={catchData.id} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[0.85rem] sm:-left-[1.1rem] top-4 sm:top-6 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 ${
                            isValid ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30"
                          }`} />

                          {/* Catch card */}
                          <div className={`ml-1 sm:ml-2 p-2 sm:p-3 rounded-lg border transition-all ${
                            isValid 
                              ? "bg-card hover:bg-accent/5 border-border" 
                              : "bg-muted/30 border-muted-foreground/20"
                          }`}>
                            <div className="flex items-start gap-2 sm:gap-3">
                              {/* Time */}
                              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap pt-0.5 sm:pt-1" suppressHydrationWarning>
                                {format(new Date(catchData.caught_at || catchData.created_at), "HH:mm")}
                              </div>

                              {/* Avatar */}
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarImage src={participant?.profiles?.avatar_url || catchData.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                </AvatarFallback>
                              </Avatar>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className="font-medium text-sm sm:text-base truncate">
                                      {participant?.profiles?.nickname || catchData.profiles?.nickname || "Neznámý"}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0 sm:px-2 sm:py-0.5">
                                      {catchData.species}
                                    </Badge>
                                    {!isValid && (
                                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1 py-0 sm:px-2 bg-amber-50 text-amber-700 border-amber-200">
                                        Nezapočítán
                                      </Badge>
                                    )}
                                  </div>
                                  {isValid && (
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-base sm:text-lg font-bold text-primary">
                                        {score.toFixed(scoringType === "measurements" ? 1 : 0)}
                                      </div>
                                      <div className="text-[9px] sm:text-xs text-muted-foreground">
                                        {scoringType === "points" ? "bodů" : "skóre"}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                                  {catchData.length_cm && (
                                    <span className="text-[11px] sm:text-sm">📏 {catchData.length_cm} cm</span>
                                  )}
                                  {catchData.weight_kg && (
                                    <span className={`text-[11px] sm:text-sm ${!isValid && minWeightKg ? "text-amber-700 font-medium" : ""}`}>
                                      ⚖️ {catchData.weight_kg} kg
                                      {!isValid && minWeightKg && (
                                        <span className="ml-1 text-[9px] sm:text-xs">(&lt; {minWeightKg} kg)</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Photo */}
                              <div 
                                className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setSelectedImage(catchData.photo_url)}
                              >
                                <img
                                  src={catchData.photo_url}
                                  alt={catchData.species}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}