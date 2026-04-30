# Mouse Tracking Feature

## Overview

The mouse tracking feature captures mouse movements and clicks during chart viewing in the RTL study. It tracks mouse coordinates only within the chart image boundaries during the 8-second display window, providing precise behavioral data for analysis.

## Key Features

- **Chart-Aware Tracking**: Only records coordinates within chart image boundaries
- **Time-Bound**: Tracks only during the 8-second chart display window
- **Iframe Support**: Captures mouse events from both main window and iframe content
- **Boundary Filtering**: Automatically filters out-of-bounds coordinates
- **Event-Driven**: Controlled via `showChartClicked`/`hideChartClicked` events

## Architecture

### Core Components

1. **Mouse Tracking Utilities** (`src/utils/mouseTracking.ts`)
   - `detectChartBounds()`: Finds chart image element and returns its boundaries
   - `filterMousePointsByBounds()`: Filters mouse coordinates within chart area
   - `createMouseTrackingData()`: Creates tracking data from events
   - Data structures: `MouseTrackingPoint`, `ChartBounds`, `MouseTrackingData`

2. **Mouse Tracking Hook** (`src/store/hooks/useMouseTracking.ts`)
   - React hook for managing tracking lifecycle
   - Methods: `startTracking()`, `stopTracking()`, `resetTracking()`
   - Supports chart bounds filtering via `setChartBounds()`

3. **Iframe Controller** (`src/controllers/IframeController.tsx`)
   - Listens for `showChartClicked` event → posts event to ResponseBlock
   - Listens for `hideChartClicked` event → stops tracking
   - Manages iframe mouse event listeners with `chartVisibleRef` flag
   - Creates synthetic mouse events and dispatches to main window

4. **ResponseBlock Integration** (`src/components/response/ResponseBlock.tsx`)
   - Receives chart bounds detection from `chartBoundsDetected` event
   - Starts tracking on chart show, stops on chart hide
   - Listens for iframe mouse events via custom events
   - Forwards iframe events as synthetic MouseEvents

## Data Structures

```typescript
interface MouseTrackingPoint {
  timestamp: number;              // Event timestamp (ms)
  x: number;                      // X coordinate (clientX)
  y: number;                      // Y coordinate (clientY)
  eventType: 'move' | 'down' | 'up'; // Event type
}

interface ChartBounds {
  minX: number;                   // Chart left edge
  maxX: number;                   // Chart right edge
  minY: number;                   // Chart top edge
  maxY: number;                   // Chart bottom edge
}

interface MouseTrackingData {
  startTime: number;              // Tracking start time (ms)
  endTime: number;                // Tracking end time (ms)
  points: MouseTrackingPoint[];   // Tracked mouse events
  totalMovements: number;         // Count of mousemove events
  isActive: boolean;              // Whether any movement occurred
  chartBounds?: ChartBounds;      // Optional chart boundaries
}
```


## Event Flow

### Chart Display Lifecycle

1. **Chart Show**: 
   - User clicks "Show Chart" button in trial HTML
   - Trial HTML posts `showChartClicked` event to parent via Revisit
   - IframeController receives event, detects chart bounds
   - ResponseBlock receives `chartBoundsDetected` event with bounds
   - Mouse tracking starts

2. **Chart Visible**: 
   - Chart displayed for 8 seconds
   - IframeController injects mouse listeners into iframe
   - Mouse events captured and forwarded as synthetic events
   - ResponseBlock filters events by chart bounds

3. **Chart Hide**:
   - After 8 seconds, trial HTML posts `hideChartClicked` event
   - IframeController sets `chartVisibleRef.current = false`
   - Iframe listeners removed
   - ResponseBlock stops tracking
   - Tracking data finalized

## Integration Points

### Trial HTML Files

Both `trial-dropdown.html` and `trial-numerical.html` (English and Arabic) include:

```javascript
showButton.addEventListener('click', () => {
  showButton.style.display = 'none';
  stimulusContainer.style.display = 'block';
  Revisit.postEvent('showChartClicked', 'show-button');

  setTimeout(() => {
    Revisit.postEvent('hideChartClicked', 'show-button');
    // ... hide chart ...
  }, DISPLAY_TIME_MS); // 8 seconds
});
```

### Custom Events Used

- **`chartBoundsDetected`**: Posted by IframeController with chart bounds object
- **`stopChartTracking`**: Posted by IframeController when chart is hidden
- **`iframeMouseMove/Down/Up`**: Posted by IframeController with iframe mouse coordinates

## Usage for Developers

### Basic Setup

No additional setup needed. Mouse tracking is automatically enabled when:
1. Chart bounds are detected from an image element
2. `showChartClicked` event is received
3. Chart is displayed and hidden within the 8-second window

### Accessing Tracking Data

The hook automatically filters mouse coordinates by chart bounds:

```typescript
const { mouseTracking, startTracking, stopTracking, setChartBounds } = useMouseTracking();

// Set bounds when chart is detected
setChartBounds({
  minX: 100, maxX: 900,
  minY: 50, maxY: 750
});

// Only coordinates within these bounds will be recorded
```

## Important Implementation Details

1. **Bounds Detection**: `detectChartBounds()` searches for `#chart-img` element first, then falls back to any image element
2. **Iframe Event Forwarding**: IframeController checks `chartVisibleRef.current` before forwarding events to prevent tracking after chart disappears
3. **Coordinate Filtering**: Mouse points outside chart bounds are automatically excluded from tracking data
4. **Timestamp Precision**: Uses `Date.now()` for millisecond-level precision

## Supported Study Versions

- ✅ English (rtl-exp-en): trial-dropdown.html, trial-numerical.html
- ✅ Arabic (rtl-exp-ar): trial-dropdown.html, trial-numerical.html
- Both versions include `showChartClicked` and `hideChartClicked` events

