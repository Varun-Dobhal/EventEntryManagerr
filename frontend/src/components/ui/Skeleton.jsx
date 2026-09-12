import React from "react";

export const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className}`}
      {...props}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2.5 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = "" }) => (
  <div className={`card p-5 bg-white border border-slate-200 ${className}`}>
    <Skeleton className="h-9 w-9 rounded mb-3" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-3.5 w-1/2 mb-4" />
    <div className="space-y-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-full" />
    </div>
  </div>
);
