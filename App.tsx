
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useClipboardManager } from './hooks/useClipboardManager';
import ClipboardItemCard from './components/ClipboardItemCard';
import { ClearIcon, SearchIcon, ExternalLinkIcon } from './components/Icons';
import type { ClipboardEntry } from './types';

const App: React.FC = () => {
  const {
    history,
    isLoading,
    error,
    addEntry,
    deleteEntry,
    clearHistory,
    copyToSystemClipboard,
    togglePinEntry,
    setError
  } = useClipboardManager();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCopiedNotification, setShowCopiedNotification] = useState<boolean>(false);

  const handleCopyToClipboard = useCallback(async (text: string) => {
    await copyToSystemClipboard(text); // The hook will set error state if it fails
    // Check if there was an error set by the hook, if not, show success
    // A more robust way would be for copyToSystemClipboard to return a status
    if (!error) { // Simple check, assumes error is cleared on success or not set
        setShowCopiedNotification(true);
        setTimeout(() => setShowCopiedNotification(false), 2000);
    }
  }, [copyToSystemClipboard, error]); // Added error to dependency array

  useEffect(() => {
    const readClipboardAndAdd = async () => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          // Try to get focus to improve chances of clipboard read without explicit activation
          // This is a best-effort and might not always work or be desirable.
          // window.focus(); 
          const text = await navigator.clipboard.readText();
          if (text && text.trim() !== "") {
            const mostRecentNonPinned = history.find(item => !item.pinned);
            if (!mostRecentNonPinned || mostRecentNonPinned.text !== text) {
              await addEntry(text);
            }
          }
        } catch (err) {
          console.error("Failed to read clipboard on load:", err);
          if (err instanceof Error && err.name === 'NotAllowedError') {
             setError("Clipboard permission denied by browser. Please grant permission or focus the page to read from clipboard automatically.");
          } else {
             setError("Could not read clipboard automatically. You can still manage existing history.");
          }
        }
      } else {
        setError("Clipboard API not available in this browser.");
      }
    };

    if (!isLoading) {
       readClipboardAndAdd();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, addEntry, setError]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    return history.filter(item =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleClearAll = () => {
    if (history.filter(item => !item.pinned).length === 0) {
        return;
    }
    if (window.confirm("Are you sure you want to clear all non-pinned clipboard items?")) {
      clearHistory();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-slate-700 shadow-md sticky top-0 bg-slate-900 z-10">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-semibold text-sky-400">Clipboard Pro</h1>
          <button
            onClick={handleClearAll}
            title="Clear all non-pinned items"
            disabled={history.filter(item => !item.pinned).length === 0}
            className="flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-md shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClearIcon className="w-4 h-4 mr-1.5" />
            Clear Non-Pinned
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
            aria-label="Search clipboard history"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-y-auto" id="clipboard-history-list" aria-live="polite">
        {isLoading && <p className="text-center text-slate-400 mt-4">Loading history...</p>}
        
        {error && (
          <div className="bg-red-800/50 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!isLoading && !error && filteredHistory.length === 0 && (
          <p className="text-center text-slate-500 mt-8">
            {searchTerm ? "No items match your search." : "Your clipboard history is empty. Copied items will appear here."}
          </p>
        )}

        {!isLoading && filteredHistory.length > 0 && (
          <div className="space-y-1">
            {filteredHistory.map((item: ClipboardEntry) => (
              <ClipboardItemCard
                key={item.id}
                item={item}
                onCopy={handleCopyToClipboard}
                onDelete={deleteEntry}
                onTogglePin={togglePinEntry}
              />
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="p-2 border-t border-slate-700 text-center text-xs text-slate-500 sticky bottom-0 bg-slate-900 z-10">
        Clipboard Pro v1.0.0
        <a 
          href="https://github.com/google/labs-prototypes" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="ml-2 text-sky-500 hover:text-sky-400 inline-flex items-center"
          title="View Project on GitHub"
        >
          View on GitHub <ExternalLinkIcon />
        </a>
      </footer>

      {/* Copied Notification */}
      {showCopiedNotification && (
        <div 
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300"
            role="status" 
            aria-live="assertive"
        >
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default App;
