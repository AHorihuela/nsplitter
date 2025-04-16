import React from 'react';

interface UndoRedoProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const UndoRedo: React.FC<UndoRedoProps> = ({ canUndo, canRedo, onUndo, onRedo }) => {
  return (
    <div className="flex border border-gray-200 rounded-md overflow-hidden">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 transition-colors ${
          canUndo
            ? 'text-gray-700 hover:bg-gray-100 bg-white'
            : 'text-gray-400 bg-gray-50 cursor-not-allowed'
        }`}
        title="Undo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
          />
        </svg>
      </button>
      <div className="border-r border-gray-200"></div>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 transition-colors ${
          canRedo
            ? 'text-gray-700 hover:bg-gray-100 bg-white'
            : 'text-gray-400 bg-gray-50 cursor-not-allowed'
        }`}
        title="Redo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
          />
        </svg>
      </button>
    </div>
  );
};

export default UndoRedo; 