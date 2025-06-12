
import { useState, useCallback, useEffect } from 'react';
import type { ClipboardEntry } from '../types';
import { STORAGE_KEY, MAX_HISTORY_ITEMS } from '../constants';

export function useClipboardManager() {
  const [history, setHistory] = useState<ClipboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const showNotification = useCallback((message: string, title: string = "Clipboard Pro") => {
    // For a standalone app, console.log is a simple way to show notifications.
    // The main "Copied!" notification is handled visually in App.tsx.
    console.log(`Notification: ${title} - ${message}`);
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedHistoryJSON = localStorage.getItem(STORAGE_KEY);
      if (storedHistoryJSON) {
        const storedHistory = JSON.parse(storedHistoryJSON) as ClipboardEntry[];
        setHistory(storedHistory.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.timestamp - a.timestamp));
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error("Error loading history from localStorage:", e);
      setError("Failed to load clipboard history.");
      setHistory([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveHistory = useCallback(async (updatedHistory: ClipboardEntry[]) => {
    const sortedHistory = [...updatedHistory].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.timestamp - a.timestamp);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedHistory));
    } catch (e) {
      console.error("Error saving history to localStorage:", e);
      setError("Failed to save clipboard history. Storage might be full.");
    }
    setHistory(sortedHistory); // Update state regardless of save success for responsiveness
  }, []);

  const addEntry = useCallback(async (text: string) => {
    if (!text || text.trim() === "") return;

    setHistory(prevHistory => {
      const existingEntryIndex = prevHistory.findIndex(entry => entry.text === text);
      let newHistory: ClipboardEntry[];

      if (existingEntryIndex !== -1) {
        const existingEntry = prevHistory[existingEntryIndex];
        newHistory = [
          { ...existingEntry, timestamp: Date.now() },
          ...prevHistory.slice(0, existingEntryIndex),
          ...prevHistory.slice(existingEntryIndex + 1)
        ];
      } else {
        const newEntry: ClipboardEntry = {
          id: crypto.randomUUID(),
          text,
          timestamp: Date.now(),
          pinned: false,
        };
        newHistory = [newEntry, ...prevHistory];
      }
      
      let unpinnedItems = newHistory.filter(item => !item.pinned);
      const pinnedItems = newHistory.filter(item => item.pinned);

      if (unpinnedItems.length > MAX_HISTORY_ITEMS) {
        unpinnedItems = unpinnedItems.slice(0, MAX_HISTORY_ITEMS);
      }
      
      const finalHistory = [...pinnedItems, ...unpinnedItems];
      saveHistory(finalHistory); 
      return finalHistory; 
    });
  }, [saveHistory]);


  const deleteEntry = useCallback(async (id: string) => {
    const updatedHistory = history.filter(entry => entry.id !== id);
    await saveHistory(updatedHistory);
    showNotification("Item removed from history.");
  }, [history, saveHistory, showNotification]);

  const clearHistory = useCallback(async () => {
    const pinnedItems = history.filter(item => item.pinned);
    await saveHistory(pinnedItems);
    if (history.some(item => !item.pinned)) {
        showNotification("Clipboard history cleared (pinned items remain).");
    }
  }, [history, saveHistory, showNotification]);

  const copyToSystemClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Visual notification for copy success is handled in App.tsx
    } catch (e) {
      console.error("Failed to copy to system clipboard:", e);
      setError("Could not copy to clipboard. Permission might be denied by the browser.");
      showNotification("Error: Could not copy text.", "Copy Failed");
    }
  }, [showNotification]); // Removed setError from deps, showNotification is stable

  const togglePinEntry = useCallback(async (id: string) => {
    const entryIndex = history.findIndex(entry => entry.id === id);
    if (entryIndex === -1) return;

    const updatedEntry = { ...history[entryIndex], pinned: !history[entryIndex].pinned };
    const updatedHistory = [
      ...history.slice(0, entryIndex),
      updatedEntry,
      ...history.slice(entryIndex + 1)
    ];
    await saveHistory(updatedHistory); 
    showNotification(updatedEntry.pinned ? "Item pinned." : "Item unpinned.");
  }, [history, saveHistory, showNotification]);

  return {
    history,
    isLoading,
    error,
    addEntry,
    deleteEntry,
    clearHistory,
    copyToSystemClipboard,
    togglePinEntry,
    loadHistory, 
    setError
  };
}
