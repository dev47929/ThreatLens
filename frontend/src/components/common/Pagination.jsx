import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

/**
 * Generates an array of page numbers and ellipses based on currentPage and totalPages.
 * If totalPages > 7 and currentPage <= 4, produces: [1, 2, 3, 4, 5, "...", totalPages]
 * exactly as styled in the user's reference.
 */
export function getPaginationRange(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // When near the start: 1, 2, 3, 4, 5, ..., totalPages
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  // When near the end: 1, ..., totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // In the middle: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  limit = 10,
  onLimitChange,
  totalItems = null,
  pageSizeOptions = [5, 10, 20, 50, 100],
  itemLabel = "commits",
  className = "",
}) {
  const pages = getPaginationRange(page, totalPages);

  const startItem = totalItems != null && totalItems > 0 ? (page - 1) * limit + 1 : 0;
  const endItem =
    totalItems != null ? Math.min(page * limit, totalItems) : page * limit;

  return (
    <div
      className={`flex flex-col lg:flex-row items-center justify-between gap-4 pt-5 pb-2 border-t border-[#222e3a] ${className}`}
    >
      {/* Left: Summary range */}
      <div className="text-xs font-mono text-[#8a99ad] order-2 lg:order-1 flex items-center gap-1.5">
        <span>Showing</span>
        <span className="text-white font-semibold">{startItem}</span>
        <span>–</span>
        <span className="text-white font-semibold">{endItem}</span>
        {totalItems != null && (
          <>
            <span>of</span>
            <span className="text-white font-semibold">{totalItems}</span>
          </>
        )}
        <span>{itemLabel}</span>
      </div>

      {/* Center: Numeric & Chevron Pagination (Matches user visual reference) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 order-1 lg:order-2 select-none">
        {/* Previous page chevron */}
        <button
          onClick={() => onPageChange && page > 1 && onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous Page"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#8a99ad] hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page buttons */}
        {pages.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-7 h-9 flex items-center justify-center text-xs sm:text-sm font-medium text-[#627284] select-none tracking-widest"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(item);
          const isActive = pageNum === page;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange && onPageChange(pageNum)}
              aria-current={isActive ? "page" : undefined}
              className={`w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[#27303d] text-white font-semibold shadow-inner shadow-black/20"
                  : "text-[#8a99ad] hover:text-white hover:bg-white/[0.06] active:scale-95"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next page chevron */}
        <button
          onClick={() => onPageChange && page < totalPages && onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next Page"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#8a99ad] hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Dynamic rows per page selector */}
      {onLimitChange && (
        <div className="flex items-center gap-2.5 text-xs font-mono text-[#8a99ad] order-3">
          <span className="hidden sm:inline whitespace-nowrap">Rows per page:</span>
          <span className="sm:hidden whitespace-nowrap">Per page:</span>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="appearance-none pl-3 pr-8 py-1.5 bg-[#10151a] hover:bg-[#141b21] border border-[#283747] hover:border-[#38bdf8]/50 focus:border-[#38bdf8] rounded-lg text-xs font-mono text-white focus:outline-none transition-colors cursor-pointer shadow-sm"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#10151a] text-white">
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#8a99ad] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
