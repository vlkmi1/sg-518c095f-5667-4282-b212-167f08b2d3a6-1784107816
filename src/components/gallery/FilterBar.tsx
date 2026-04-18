import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catchService } from "@/services/catchService";
import type { CatchFilters } from "@/services/catchService";
import { X } from "lucide-react";

interface FilterBarProps {
  onFiltersChange: (filters: CatchFilters) => void;
}

export function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [filters, setFilters] = useState<CatchFilters>({});
  const [options, setOptions] = useState({
    countries: [] as string[],
    regions: [] as string[],
    districts: [] as string[],
    species: [] as string[],
  });

  useEffect(() => {
    // Load filter options on mount
    catchService.getFilterOptions().then(setOptions);
  }, []);

  const handleFilterChange = (key: keyof CatchFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== "all") {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">Filtrovat úlovky</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Zrušit filtry
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={filters.species || "all"}
          onValueChange={(value) => handleFilterChange("species", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Druh ryby" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny druhy</SelectItem>
            {options.species.map((species) => (
              <SelectItem key={species} value={species}>
                {species}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.country || "all"}
          onValueChange={(value) => handleFilterChange("country", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Země" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny země</SelectItem>
            {options.countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.region || "all"}
          onValueChange={(value) => handleFilterChange("region", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kraj" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny kraje</SelectItem>
            {options.regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.district || "all"}
          onValueChange={(value) => handleFilterChange("district", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Okres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny okresy</SelectItem>
            {options.districts.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}