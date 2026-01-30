import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal, X } from 'lucide-react';

interface DraggableLineProps {
  id: string;
  containerHeight: number;
  initialTopPercent?: number;
  color?: string;
  onDelete?: (id: string) => void;
}

export const DraggableLine: React.FC<DraggableLineProps> = ({ 
  id,
  containerHeight, 
  initialTopPercent = 50,
  color = 'white',
  onDelete
}) => {
  const [topPercent, setTopPercent] = useState(initialTopPercent);
  const [isDragging, setIsDragging] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking the delete button
    if ((e.target as HTMLElement).closest('.delete-btn')) return;
    
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !lineRef.current?.parentElement) return;

      const parentRect = lineRef.current.parentElement.getBoundingClientRect();
      const clientY = e.clientY;
      
      // Calculate new position relative to parent
      let newTop = clientY - parentRect.top;
      
      // Clamp values
      newTop = Math.max(0, Math.min(newTop, parentRect.height));
      
      const newPercent = (newTop / parentRect.height) * 100;
      setTopPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Map color names to Tailwind border colors or hex values
  const getBorderColor = (c: string) => {
    const colors: Record<string, string> = {
      white: 'border-white',
      red: 'border-red-500',
      blue: 'border-blue-500',
      green: 'border-emerald-500',
      yellow: 'border-yellow-400',
    };
    return colors[c] || 'border-white';
  };
  
  const getTextColor = (c: string) => {
    const colors: Record<string, string> = {
        white: 'text-white',
        red: 'text-red-500',
        blue: 'text-blue-500',
        green: 'text-emerald-500',
        yellow: 'text-yellow-400',
      };
      return colors[c] || 'text-white';
  }

  return (
    <div
      ref={lineRef}
      className="absolute left-0 w-full group cursor-row-resize z-20 hover:opacity-100"
      style={{ top: `${topPercent}%` }}
      onMouseDown={handleMouseDown}
    >
      {/* The visible line */}
      <div className={`w-full border-t-2 border-dashed shadow-sm ${getBorderColor(color)} ${isDragging ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
      
      {/* Handle for easier grabbing */}
      <div className="absolute right-2 -top-3 flex items-center gap-1">
         <div className="bg-black/50 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <GripHorizontal size={16} />
         </div>
         {onDelete && (
            <button 
                className="delete-btn bg-red-500/80 hover:bg-red-600 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                }}
            >
                <X size={16} />
            </button>
         )}
      </div>
      
      {/* Helper text */}
      <div className={`absolute left-2 -top-6 bg-black/50 ${getTextColor(color)} text-xs px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
        基準線
      </div>
    </div>
  );
};
