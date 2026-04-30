/**
 * Mouse Tracking Context
 *
 * Provides mouse tracking data to child components and allows them to register
 * and retrieve mouse tracking information for specific components.
 */

import React, {
  createContext, useContext, useState, useCallback, useMemo,
} from 'react';
import { MouseTrackingData } from '../../utils/mouseTracking';

interface MouseTrackingContextType {
  mouseTrackingData: Record<string, MouseTrackingData>;
  registerMouseTracking: (identifier: string, data: MouseTrackingData) => void;
  getMouseTracking: (identifier: string) => MouseTrackingData | undefined;
  clearMouseTracking: () => void;
}

const MouseTrackingContext = createContext<MouseTrackingContextType | undefined>(undefined);

export function MouseTrackingProvider({ children }: { children: React.ReactNode }) {
  const [mouseTrackingData, setMouseTrackingData] = useState<Record<string, MouseTrackingData>>({});

  const registerMouseTracking = useCallback((identifier: string, data: MouseTrackingData) => {
    setMouseTrackingData((prev) => ({
      ...prev,
      [identifier]: data,
    }));
  }, []);

  const getMouseTracking = useCallback((identifier: string) => mouseTrackingData[identifier], [mouseTrackingData]);

  const clearMouseTracking = useCallback(() => {
    setMouseTrackingData({});
  }, []);

  const value = useMemo(() => ({
    mouseTrackingData,
    registerMouseTracking,
    getMouseTracking,
    clearMouseTracking,
  }), [mouseTrackingData, registerMouseTracking, getMouseTracking, clearMouseTracking]);

  return (
    <MouseTrackingContext.Provider value={value}>
      {children}
    </MouseTrackingContext.Provider>
  );
}

export function useMouseTrackingContext(): MouseTrackingContextType {
  const context = useContext(MouseTrackingContext);
  if (!context) {
    throw new Error('useMouseTrackingContext must be used within MouseTrackingProvider');
  }
  return context;
}
