import { useState, useEffect } from "react";
import { Calendar, Clock, Trophy, Fish, Users, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CompetitionCountdownProps {
  startDate: string;
  endDate: string;
  terminatedEarly?: boolean;
  // Statistics for ended competitions
  totalCatches?: number;
  totalParticipants?: number;
  winner?: {
    nickname: string;
    avatar_url?: string;
    score: number;
    catchCount: number;
  };
  topSpecies?: Array<{
    species: string;
    count: number;
  }>;
  scoringType?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CompetitionCountdown({ 
  startDate, 
  endDate, 
  terminatedEarly,
  totalCatches = 0,
  totalParticipants = 0,
  winner,
  topSpecies = [],
  scoringType = "measurements"
}: CompetitionCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [status, setStatus] = useState<"upcoming" | "ongoing" | "ended">("upcoming");

  useEffect(() => {
    function calculateTimeRemaining(): TimeRemaining | null {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      // Determine status
      if (now < start) {
        setStatus("upcoming");
        const diff = start - now;
        return {
          total: diff,
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        };
      } else if (now >= start && now < end) {
        setStatus("ongoing");
        const diff = end - now;
        return {
          total: diff,
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        };
      } else {
        setStatus("ended");
        return null;
      }
    }

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  if (terminatedEarly) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 text-red-700">
          <Trophy className="h-5 w-5" />
          <span className="font-semibold">Závod byl předčasně ukončen</span>
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <h3 className="font-serif text-2xl font-bold text-yellow-700">
                🏁 Závod ukončen
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Výsledky a statistiky
            </p>
          </div>

          {/* Winner Section */}
          {winner && (
            <div className="bg-yellow-500/20 border-2 border-yellow-500/40 rounded-lg p-4">
              <div className="text-center mb-3">
                <div className="text-4xl mb-2">🥇</div>
                <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide mb-2">
                  Vítěz závodu
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-yellow-500">
                    <AvatarImage src={winner.avatar_url || undefined} />
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-700">
                      <Trophy className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{winner.nickname}</p>
                    <p className="text-sm text-muted-foreground">
                      {winner.catchCount} {winner.catchCount === 1 ? "úlovek" : winner.catchCount < 5 ? "úlovky" : "úlovků"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-700">{winner.score}</p>
                  <p className="text-xs text-muted-foreground">
                    {scoringType === "points" ? "bodů" : "skóre"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Catches */}
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <Fish className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{totalCatches}</p>
              <p className="text-xs text-muted-foreground">
                {totalCatches === 1 ? "úlovek" : totalCatches < 5 ? "úlovky" : "úlovků"}
              </p>
            </div>

            {/* Total Participants */}
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground">
                {totalParticipants === 1 ? "účastník" : totalParticipants < 5 ? "účastníci" : "účastníků"}
              </p>
            </div>
          </div>

          {/* Top Species */}
          {topSpecies.length > 0 && (
            <div className="bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Nejčastější úlovky</p>
              </div>
              <div className="space-y-2">
                {topSpecies.slice(0, 3).map((item, index) => (
                  <div key={item.species} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                      <span>{item.species}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.count}× uloveno
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!timeRemaining) {
    return null;
  }

  const isUrgent = timeRemaining.total < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <div className={`rounded-lg p-4 border ${
      status === "upcoming" 
        ? "bg-blue-500/10 border-blue-500/20" 
        : isUrgent
        ? "bg-orange-500/10 border-orange-500/20"
        : "bg-green-500/10 border-green-500/20"
    }`}>
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Clock className={`h-5 w-5 ${
            status === "upcoming" 
              ? "text-blue-600" 
              : isUrgent
              ? "text-orange-600"
              : "text-green-600"
          }`} />
          <span className={`font-semibold ${
            status === "upcoming" 
              ? "text-blue-700" 
              : isUrgent
              ? "text-orange-700"
              : "text-green-700"
          }`}>
            {status === "upcoming" ? "⏳ Začátek za" : "🏁 Do konce"}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 text-2xl font-bold tabular-nums">
          {timeRemaining.days > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-3xl">{timeRemaining.days}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {timeRemaining.days === 1 ? "den" : timeRemaining.days < 5 ? "dny" : "dní"}
              </span>
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <span className="text-3xl">{String(timeRemaining.hours).padStart(2, "0")}</span>
            <span className="text-xs text-muted-foreground font-normal">hodin</span>
          </div>
          
          <span className="text-muted-foreground">:</span>
          
          <div className="flex flex-col items-center">
            <span className="text-3xl">{String(timeRemaining.minutes).padStart(2, "0")}</span>
            <span className="text-xs text-muted-foreground font-normal">minut</span>
          </div>
          
          <span className="text-muted-foreground">:</span>
          
          <div className="flex flex-col items-center">
            <span className="text-3xl">{String(timeRemaining.seconds).padStart(2, "0")}</span>
            <span className="text-xs text-muted-foreground font-normal">sekund</span>
          </div>
        </div>

        {isUrgent && status === "ongoing" && (
          <Badge variant="outline" className="bg-orange-500/20 text-orange-700 border-orange-500/30">
            ⚡ Méně než 24 hodin!
          </Badge>
        )}
      </div>
    </div>
  );
}