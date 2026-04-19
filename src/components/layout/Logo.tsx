import Link from "next/link";
import { Fish } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all" />
        <div className="relative bg-primary text-primary-foreground p-2 rounded-full group-hover:scale-110 transition-transform">
          <Fish className="h-5 w-5" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-serif text-lg sm:text-xl font-bold text-foreground leading-tight">
          Ukaž Rybu
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          Sdílej své úlovky
        </span>
      </div>
    </Link>
  );
}