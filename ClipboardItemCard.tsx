
import React from 'react';
import type { ClipboardEntry } from '../types';
import { CopyIcon, DeleteIcon, PinIcon } from './Icons';

interface ClipboardItemCardProps {
  item: ClipboardEntry;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const ClipboardItemCard: React.FC<ClipboardItemCardProps> = ({ item, onCopy, onDelete, onTogglePin }) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(item.text);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this item?")) {
        onDelete(item.id);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(item.id);
  };
  
  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  const displayText = item.text.length > 150 ? `${item.text.substring(0, 150)}...` : item.text;

  return (
    <div 
      className={`p-3 mb-2 rounded-lg shadow transition-all duration-150 ease-in-out flex flex-col justify-between
                  ${item.pinned ? 'bg-sky-800 hover:bg-sky-700' : 'bg-slate-700 hover:bg-slate-600'}`}
    >
      <p 
        className="text-sm text-slate-100 break-words whitespace-pre-wrap mb-2 cursor-pointer"
        title={item.text} // Show full text on hover
        onClick={() => onCopy(item.text)} // Click text to copy
      >
        {displayText}
      </p>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-slate-400">{formattedDate}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTogglePin}
            title={item.pinned ? "Unpin item" : "Pin item"}
            className={`p-1.5 rounded-md ${item.pinned ? 'text-yellow-400 hover:bg-sky-600' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-500'}`}
          >
            <PinIcon pinned={item.pinned} className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-500"
          >
            <CopyIcon className="w-4 h-4" />
          </button>
          {!item.pinned && ( // Do not allow deleting pinned items directly, unpin first
             <button
                onClick={handleDelete}
                title="Delete item"
                className="p-1.5 rounded-md text-rose-400 hover:text-rose-200 hover:bg-rose-600"
             >
                <DeleteIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipboardItemCard;
