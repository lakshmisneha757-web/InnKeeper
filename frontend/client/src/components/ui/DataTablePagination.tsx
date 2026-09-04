import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = "items",
  className = "",
}: DataTablePaginationProps) {
  const { t } = useTranslation();

  const isAll = pageSize === 0;
  const startItem = isAll ? (totalItems > 0 ? 1 : 0) : Math.min(totalItems, (currentPage - 1) * pageSize + 1);
  const endItem = isAll ? totalItems : Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60 text-xs text-muted-foreground ${className}`}>
      {/* Left: Summary & Page Size */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {t("common.showing", "Showing")}{" "}
          <strong className="text-foreground font-semibold">{startItem}</strong>
          {" - "}
          <strong className="text-foreground font-semibold">{endItem}</strong>
          {" "}{t("common.of", "of")}{" "}
          <strong className="text-foreground font-semibold">{totalItems}</strong>
          {" "}{itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-card border border-border/80 rounded-lg px-2 py-1 text-xs font-semibold text-foreground focus:outline-none cursor-pointer hover:border-border"
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-card text-foreground">
                  {opt === 0 ? "All" : opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation controls */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* First Page */}
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg cursor-pointer hidden min-[400px]:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 rounded-lg cursor-pointer gap-1"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("common.previous", "Prev")}</span>
          </Button>

          {/* Page numbers (hidden on very small screens) */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((num, i) => {
              if (num === "...") {
                return (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground select-none">
                    …
                  </span>
                );
              }
              const p = Number(num);
              const isActive = p === currentPage;
              return (
                <Button
                  key={p}
                  size="icon"
                  variant={isActive ? "default" : "outline"}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold cursor-pointer ${
                    isActive ? "shadow-xs pointer-events-none" : "hover:bg-muted/70"
                  }`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              );
            })}
          </div>

          {/* Compact Page Indicator on mobile */}
          <span className="text-xs font-bold text-foreground px-2 sm:hidden">
            {currentPage} / {totalPages}
          </span>

          {/* Next Page */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 rounded-lg cursor-pointer gap-1"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">{t("common.next", "Next")}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg cursor-pointer hidden min-[400px]:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last Page"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default DataTablePagination;
