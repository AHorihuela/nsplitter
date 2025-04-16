import React from 'react';
import UndoRedo from './UndoRedo';

interface CanvasControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  isProcessing: boolean;
  showExport: boolean;
}

export function CanvasControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExport,
  isProcessing,
  showExport
}: CanvasControlsProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <UndoRedo
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
        >
          Clear Lines
        </button>
      </div>
      {showExport && (
        <button
          onClick={onExport}
          disabled={isProcessing}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md shadow-sm text-white
            ${isProcessing
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'}
            transition-colors duration-200
          `}
        >
          {isProcessing ? 'Processing...' : 'Export Slices'}
        </button>
      )}
    </div>
  );
} 