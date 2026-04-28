/**
 * Mouse Tracking Utilities
 *
 * This module provides utilities for capturing and managing mouse tracking data
 * independently for each chart question or component.
 */

import type { EventType } from '../store/types';

/**
 * Represents a single mouse event with timestamp and coordinates
 */
export interface MouseTrackingPoint {
  timestamp: number;
  x: number;
  y: number;
  eventType: 'move' | 'down' | 'up';
}

/**
 * Represents the bounding box of a chart image
 */
export interface ChartBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Mouse tracking data stored for a single component/question
 */
export interface MouseTrackingData {
  startTime: number;
  endTime: number;
  points: MouseTrackingPoint[];
  totalMovements: number;
  isActive: boolean;
  chartBounds?: ChartBounds;
}

/**
 * Filters mouse-related events from a list of window events
 * @param events - Array of window events
 * @returns Array of mouse-specific events
 */
export function extractMouseEvents(events: EventType[]): EventType[] {
  return events.filter((event): event is EventType => {
    const eventType = event[1];
    return eventType === 'mousemove' || eventType === 'mousedown' || eventType === 'mouseup';
  });
}

/**
 * Converts raw window events to mouse tracking points
 * @param events - Array of raw mouse events from window event tracking
 * @returns Array of mouse tracking points
 */
export function eventsToMouseTrackingPoints(events: EventType[]): MouseTrackingPoint[] {
  return events.map((event) => {
    const timestamp = event[0];
    const eventType = event[1];
    const coordinates = event[2] as number[];

    return {
      timestamp,
      x: coordinates[0],
      y: coordinates[1],
      eventType: eventType === 'mousemove' ? 'move' : (eventType === 'mousedown' ? 'down' : 'up'),
    };
  });
}

/**
 * Filters mouse points within specific spatial bounds (chart boundaries)
 * @param points - Array of mouse tracking points
 * @param bounds - Chart bounding box
 * @returns Filtered mouse tracking points within the bounds
 */
export function filterMousePointsByBounds(
  points: MouseTrackingPoint[],
  bounds: ChartBounds,
): MouseTrackingPoint[] {
  return points.filter((point) => {
    const withinBounds = point.x >= bounds.minX
      && point.x <= bounds.maxX
      && point.y >= bounds.minY
      && point.y <= bounds.maxY;

    return withinBounds;
  });
}

/**
 * Creates mouse tracking data from component lifecycle
 * @param startTime - Component start time in milliseconds
 * @param endTime - Component end time in milliseconds
 * @param windowEvents - All window events during component interaction
 * @param chartBounds - Optional chart boundaries to filter points
 * @returns Mouse tracking data object
 */
export function createMouseTrackingData(
  startTime: number,
  endTime: number,
  windowEvents: EventType[],
  chartBounds?: ChartBounds,
): MouseTrackingData {
  const mouseEvents = extractMouseEvents(windowEvents);
  let points = eventsToMouseTrackingPoints(mouseEvents);

  // Filter points by chart bounds if provided
  if (chartBounds) {
    points = filterMousePointsByBounds(points, chartBounds);
  }

  return {
    startTime,
    endTime,
    points,
    totalMovements: points.filter((p) => p.eventType === 'move').length,
    isActive: points.length > 0,
    chartBounds,
  };
}

/**
 * Checks if mouse tracking data is valid and has meaningful movement
 * @param data - Mouse tracking data to validate
 * @returns True if data has at least one mouse event
 */
export function isValidMouseTrackingData(data: MouseTrackingData): boolean {
  return data.isActive && data.points.length > 0;
}

/**
 * Filters mouse points within a specific time range
 * @param points - Array of mouse tracking points
 * @param startTime - Start time in milliseconds
 * @param endTime - End time in milliseconds
 * @returns Filtered mouse tracking points
 */
export function filterMousePointsByTime(
  points: MouseTrackingPoint[],
  startTime: number,
  endTime: number,
): MouseTrackingPoint[] {
  return points.filter((point) => point.timestamp >= startTime && point.timestamp <= endTime);
}

/**
 * Detects the bounding box of a chart image on the page
 * Looks for img elements with common chart identifiers
 * @param doc - Optional document to search within (for iframe support). Defaults to window.document
 * @returns Chart bounds or null if no chart image found
 */
export function detectChartBounds(doc?: Document): ChartBounds | null {
  const searchDoc = doc || window.document;
  // Look for common chart image identifiers
  const imageSelectors = [
    '#chart-img',
    'img[class*="chart"]',
    'img[class*="stimulus"]',
    'img[role="img"]',
    '#chart-image',
    '[data-chart]',
    '.chart-container img',
    '.stimulus img',
  ];

  let chartImage: HTMLImageElement | null = null;

  for (const selector of imageSelectors) {
    const elem = searchDoc.querySelector(selector) as HTMLImageElement;
    if (elem && elem.offsetWidth > 0 && elem.offsetHeight > 0) {
      chartImage = elem;
      break;
    }
  }

  // Fallback: find any visible img element that's large enough to be a chart
  if (!chartImage) {
    const allImages = searchDoc.querySelectorAll('img');
    for (const img of allImages) {
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.width < window.innerWidth && rect.height < window.innerHeight) {
        chartImage = img;
        break;
      }
    }
  }

  if (!chartImage) {
    console.error('No chart image detected on page');
    return null;
  }

  const rect = chartImage.getBoundingClientRect();
  const bounds: ChartBounds = {
    minX: Math.round(rect.left),
    maxX: Math.round(rect.right),
    minY: Math.round(rect.top),
    maxY: Math.round(rect.bottom),
  };

  return bounds;
}
