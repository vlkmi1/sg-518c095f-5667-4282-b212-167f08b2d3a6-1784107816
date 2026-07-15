import { Fish } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all" />
      <div className="relative bg-primary text-primary-foreground p-2 rounded-full group-hover:scale-110 transition-transform">
        <Fish className="h-5 w-5" />
      </div>
    </div>
  );
}