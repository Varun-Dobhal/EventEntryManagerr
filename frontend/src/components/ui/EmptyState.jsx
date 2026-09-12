import React from "react";

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded border border-dashed border-slate-300 bg-white shadow-xs ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4 text-[#8B151B]">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6 text-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="btn btn-primary btn-sm px-5 animate-pop-in"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
