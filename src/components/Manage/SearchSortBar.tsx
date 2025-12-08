"use client";

import { Search, ArrowUpDown, XCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

interface SearchSortBarProps {
  search: string;
  setSearch: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  searchPlaceholder: string;
  total: number;
  showing: number;
  searchActiveText: string;
}

export function SearchSortBar({
  search,
  setSearch,
  sortOrder,
  setSortOrder,
  onClearFilters,
  searchPlaceholder,
  total,
  showing,
  searchActiveText
}: SearchSortBarProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e: any) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={sortOrder === 'asc' ? 'primary' : 'secondary'}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex-1 sm:flex-none"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === 'asc' ? 'Antigos ↑' : 'Recentes ↓'}
          </Button>
          {(search || sortOrder === 'desc') && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClearFilters}
              className="flex-1 sm:flex-none"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Limpar Filtro
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
        <div>
          <span>Total: {total}</span>
          <span className="mx-2">•</span>
          <span>Mostrando: {showing}</span>
        </div>
        {search && (
          <div className="text-amber-600 dark:text-amber-400 text-xs">
            {searchActiveText}
          </div>
        )}
      </div>
    </Card>
  );
}