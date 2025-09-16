'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTrackerData } from '../lib/useTrackerData';
import type { TrackerState } from '../types/tracker';

type TrackerContextType = ReturnType<typeof useTrackerData>;

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const trackerData = useTrackerData();

  return (
    <TrackerContext.Provider value={trackerData}>
      {children}
    </TrackerContext.Provider>
  );
}

export function useTrackerContext() {
  const context = useContext(TrackerContext);
  if (context === undefined) {
    throw new Error('useTrackerContext must be used within a TrackerProvider');
  }
  return context;
}