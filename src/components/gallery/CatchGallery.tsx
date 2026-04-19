import { useEffect, useState } from "react";
import { catchService } from "@/services/catchService";
import type { CatchWithProfile, CatchFilters } from "@/services/catchService";
import { CatchCard } from "./CatchCard";
import { FilterBar } from "./FilterBar";
import { Fish } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CatchGallery() {
  const [catches, setCatches] = useState<CatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CatchFilters>({});
  const { toast } = useToast();

  useEffect(() => {
    loadCatches();
  }, [filters]);

  async function loadCatches() {
    setLoading(true);
    try {
      const { data, error } = await catchService.getCatches(filters);
      
      if (error) {
        toast({
          title: "Chyba načítání",
          description: "Nepodařilo se načíst úlovky",
          variant: "destructive",
        });
        return;
      }

      // Filter out competition catches - they should not appear in public gallery
      const publicCatches = (data || []).filter(
        (c: any) => c.is_public === true && !c.competition_id
      );

      console.log("Public catches loaded:", publicCatches.length);

      setCatches(publicCatches);
    } catch (error) {
      console.error("Error loading catches:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Načítám úlovky...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 sm:py-8 space-y-4 sm:space-y-6">
      <FilterBar onFiltersChange={setFilters} />

      {catches.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4 text-muted-foreground space-y-3 sm:space-y-4">
          <Fish className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30" />
          <p className="text-base sm:text-lg">
            {Object.keys(filters).length > 0
              ? "Žádné úlovky pro zvolené filtry"
              : "Zatím zde nejsou žádné úlovky"}
          </p>
          <p className="text-sm">Staňte se prvním, kdo přidá svůj úlovek!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Zobrazeno: {catches.length} {catches.length === 1 ? "úlovek" : catches.length < 5 ? "úlovky" : "úlovků"}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {catches.map((catchData) => (
              <CatchCard key={catchData.id} catch={catchData} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}