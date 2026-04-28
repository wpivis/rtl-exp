/**
 * useMouseTracking Hook
 *
 * A React hook that captures and manages mouse tracking data independently
 * for each component/question during user interaction.
 */

import {
  useEffect, useRef, useState, useCallback,
} from 'react';
import {
  MouseTrackingData, createMouseTrackingData, ChartBounds,
} from '../../utils/mouseTracking';
import { EventType } from '../types';

interface UseMouseTrackingOptions {
  enabled?: boolean;
  captureTarget?: HTMLElement | null;
  chartBounds?: ChartBounds | null;
}

interface UseMouseTrackingReturn {
  mouseTracking: MouseTrackingData | null;
  startTracking: () => void;
  stopTracking: () => void;
  resetTracking: () => void;
  isTracking: boolean;
  setChartBounds: (bounds: ChartBounds | null) => void;
  chartBounds: ChartBounds | null;
}

/**
 * Hook to track mouse movements and clicks for a specific component
 *
 * @param options - Configuration options for tracking
 * @returns Object containing tracking state and control functions
 *
 * @example
 * const { mouseTracking, startTracking, stopTracking, isTracking } = useMouseTracking({
 *   enabled: true,
 *   captureTarget: elementRef.current,
 * });
 *
 * useEffect(() => {
 *   startTracking();
 *   return () => stopTracking();
 * }, [startTracking, stopTracking]);
 */
export function useMouseTracking(options: UseMouseTrackingOptions = {}): UseMouseTrackingReturn {
  const {
    enabled = true,
    captureTarget = null,
    chartBounds: initialChartBounds = null,
  } = options;

  const [isTracking, setIsTracking] = useState(false);
  const [mouseTracking, setMouseTracking] = useState<MouseTrackingData | null>(null);
  const [chartBounds, setChartBounds] = useState<ChartBounds | null>(initialChartBounds);

  const startTimeRef = useRef<number | null>(null);
  const localEventsRef = useRef<EventType[]>([]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!enabled) return;

    startTimeRef.current = Date.now();
    localEventsRef.current = [];
    setIsTracking(true);
  }, [enabled]);

  // Stop tracking and compile the data
  const stopTracking = useCallback(() => {
    if (!isTracking || startTimeRef.current === null) return;

    const endTime = Date.now();
    const startTime = startTimeRef.current;

    const trackingData = createMouseTrackingData(
      startTime,
      endTime,
      localEventsRef.current,
    );

    setMouseTracking(trackingData);
    setIsTracking(false);
    startTimeRef.current = null;
  }, [isTracking]);

  // Reset tracking data
  const resetTracking = useCallback(() => {
    setMouseTracking(null);
    localEventsRef.current = [];
    startTimeRef.current = null;
    setIsTracking(false);
  }, []);

  // Attach event listeners when tracking is active
  useEffect(() => {
    if (!isTracking || !enabled) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Only track if within bounds (or no bounds set)
      if (chartBounds) {
        const withinX = e.clientX >= chartBounds.minX && e.clientX <= chartBounds.maxX;
        const withinY = e.clientY >= chartBounds.minY && e.clientY <= chartBounds.maxY;
        if (!withinX || !withinY) {
          return;
        }
      }
      console.warn(`[Chart Mouse] MOVE - X: ${e.clientX}, Y: ${e.clientY}`);
      localEventsRef.current.push([Date.now(), 'mousemove', [e.clientX, e.clientY]]);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only track if within bounds (or no bounds set)
      if (chartBounds) {
        const withinX = e.clientX >= chartBounds.minX && e.clientX <= chartBounds.maxX;
        const withinY = e.clientY >= chartBounds.minY && e.clientY <= chartBounds.maxY;
        if (!withinX || !withinY) {
          return;
        }
      }
      localEventsRef.current.push([Date.now(), 'mousedown', [e.clientX, e.clientY]]);
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Only track if within bounds (or no bounds set)
      if (chartBounds) {
        const withinX = e.clientX >= chartBounds.minX && e.clientX <= chartBounds.maxX;
        const withinY = e.clientY >= chartBounds.minY && e.clientY <= chartBounds.maxY;
        if (!withinX || !withinY) {
          return;
        }
      }
      localEventsRef.current.push([Date.now(), 'mouseup', [e.clientX, e.clientY]]);
    };

    if (captureTarget) {
      captureTarget.addEventListener('mousemove', handleMouseMove);
      captureTarget.addEventListener('mousedown', handleMouseDown);
      captureTarget.addEventListener('mouseup', handleMouseUp);

      // eslint-disable-next-line consistent-return
      return () => {
        captureTarget.removeEventListener('mousemove', handleMouseMove);
        captureTarget.removeEventListener('mousedown', handleMouseDown);
        captureTarget.removeEventListener('mouseup', handleMouseUp);
      };
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // eslint-disable-next-line consistent-return
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTracking, enabled, captureTarget, chartBounds]);

  return {
    mouseTracking,
    startTracking,
    stopTracking,
    resetTracking,
    isTracking,
    setChartBounds,
    chartBounds,
  };
}

export default useMouseTracking;
