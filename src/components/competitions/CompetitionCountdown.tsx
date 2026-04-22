import { useState, useEffect } from "react";
import { Calendar, Clock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompetitionCountdownProps {
  startDate: string;
  endDate: string;
  terminatedEarly?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CompetitionCountdown({ startDate, endDate, terminatedEarly }: CompetitionCountdownProps) {
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
      <div className="bg-muted/50 border rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Trophy className="h-5 w-5" />
          <span className="font-semibold">Závod skončil</span>
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