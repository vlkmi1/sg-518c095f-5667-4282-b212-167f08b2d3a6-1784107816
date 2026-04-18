import { useEffect, useState } from "react";
import { catchService } from "@/services/catchService";
import type { CatchWithProfile, CatchFilters } from "@/services/catchService";
import { CatchCard } from "./CatchCard";
import { FilterBar } from "./FilterBar";
import { Fish } from "lucide-react";

export function CatchGallery() {
  const [catches, setCatches] = useState<CatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CatchFilters>({});

  useEffect(() => {
    loadCatches();
  }, [filters]);

  const loadCatches = async () => {
    setLoading(true);
    const { data } = await catchService.getCatches(filters);
    setCatches(data || []);
    setLoading(false);
  };

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
    <div className="container py-8 space-y-6">
      <FilterBar onFiltersChange={setFilters} />

      {catches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-4">
          <Fish className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <p className="text-lg">
            {Object.keys(filters).length > 0
              ? "Žádné úlovky pro zvolené filtry"
              : "Zatím zde nejsou žádné úlovky"}
          </p>
          <p className="text-sm">Staňte se prvním, kdo přidá svůj úlovek!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Zobrazeno: {catches.length} {catches.length === 1 ? "úlovek" : catches.length < 5 ? "úlovky" : "úlovků"}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {catches.map((catchData) => (
              <CatchCard key={catchData.id} catch={catchData} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}