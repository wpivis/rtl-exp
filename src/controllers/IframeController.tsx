import {
  useCallback, useEffect, useMemo, useRef,
} from 'react';
import { useDispatch } from 'react-redux';
import { useCurrentComponent, useCurrentIdentifier } from '../routes/utils';
import { useStoreDispatch, useStoreActions } from '../store/store';
import { ParticipantData, WebsiteComponent } from '../parser/types';
import { PREFIX as BASE_PREFIX } from '../utils/Prefix';
import { detectChartBounds, ChartBounds } from '../utils/mouseTracking';

const PREFIX = '@REVISIT_COMMS';

export function IframeController({ currentConfig, provState, answers }: { currentConfig: WebsiteComponent; provState?: unknown, answers: ParticipantData['answers'] }) {
  const {
    setReactiveAnswers, updateResponseBlockValidation,
  } = useStoreActions();
  const storeDispatch = useStoreDispatch();
  const dispatch = useDispatch();
  const identifier = useCurrentIdentifier();

  const ref = useRef<HTMLIFrameElement>(null);
  const iframeListenersRef = useRef<{
    mousemove?:(evt: MouseEvent) => void,
    mousedown?: (evt: MouseEvent) => void,
    mouseup?: (evt: MouseEvent) => void,
      }>({});
  const chartVisibleRef = useRef(false); // Track if chart is currently visible

  const iframeId = useMemo(
    () => (crypto.randomUUID ? crypto.randomUUID() : `testID-${Date.now()}`),
    [],
  );

  // navigation
  const currentComponent = useCurrentComponent();

  const sendMessage = useCallback(
    (tag: string, message: unknown) => {
      ref.current?.contentWindow?.postMessage(
        {
          error: false,
          type: `${PREFIX}/${tag}`,
          iframeId,
          message,
        },
        '*',
      );
    },
    [ref, iframeId],
  );

  useEffect(() => {
    if (provState) {
      sendMessage('PROVENANCE', provState);
    }
  }, [provState, sendMessage]);

  useEffect(() => {
    if (answers) {
      sendMessage('ANSWERS', answers);
    }
  }, [answers, sendMessage]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const { data } = e;
      if (typeof data === 'object' && iframeId === data.iframeId) {
        switch (data.type) {
          case `${PREFIX}/WINDOW_READY`:
            if (currentConfig.parameters) {
              sendMessage('STUDY_DATA', currentConfig.parameters);
            }
            break;
          case `${PREFIX}/READY`:
            break;
          case `${PREFIX}/ANSWERS`:
            storeDispatch(setReactiveAnswers(data.message));
            storeDispatch(updateResponseBlockValidation({
              location: 'stimulus',
              identifier,
              status: true,
              values: data.message,
            }));
            break;
          case `${PREFIX}/PROVENANCE`:
            storeDispatch(updateResponseBlockValidation({
              location: 'stimulus',
              identifier,
              values: {},
              status: true,
              provenanceGraph: data.message,
            }));
            break;
          case `${PREFIX}/EVENT`:
            if (data.message.eventName === 'showChartClicked') {
              // Call detectChartBounds when the "Show Chart" button is clicked
              // Pass the iframe's document to search within it
              let bounds: ChartBounds | null = null;
              if (ref.current?.contentDocument) {
                bounds = detectChartBounds(ref.current.contentDocument);
              } else {
                bounds = detectChartBounds();
              }
              // Dispatch event to all listeners with chart bounds
              if (bounds) {
                window.dispatchEvent(new CustomEvent('chartBoundsDetected', { detail: bounds }));
              }
              // Inject event listeners into iframe to capture mouse movements within it
              if (ref.current?.contentDocument) {
                const iframeDoc = ref.current.contentDocument;
                chartVisibleRef.current = true;

                const handleIframeMouseMove = (evt: MouseEvent) => {
                  // Only dispatch if chart is still visible
                  if (chartVisibleRef.current) {
                    window.dispatchEvent(new CustomEvent('iframeMouseMove', { detail: { clientX: evt.clientX, clientY: evt.clientY } }));
                  }
                };
                const handleIframeMouseDown = (evt: MouseEvent) => {
                  // Only dispatch if chart is still visible
                  if (chartVisibleRef.current) {
                    window.dispatchEvent(new CustomEvent('iframeMouseDown', { detail: { clientX: evt.clientX, clientY: evt.clientY } }));
                  }
                };
                const handleIframeMouseUp = (evt: MouseEvent) => {
                  // Only dispatch if chart is still visible
                  if (chartVisibleRef.current) {
                    window.dispatchEvent(new CustomEvent('iframeMouseUp', { detail: { clientX: evt.clientX, clientY: evt.clientY } }));
                  }
                };

                // Store listener references for later removal
                iframeListenersRef.current = {
                  mousemove: handleIframeMouseMove,
                  mousedown: handleIframeMouseDown,
                  mouseup: handleIframeMouseUp,
                };

                iframeDoc.addEventListener('mousemove', handleIframeMouseMove);
                iframeDoc.addEventListener('mousedown', handleIframeMouseDown);
                iframeDoc.addEventListener('mouseup', handleIframeMouseUp);
              }
            } else if (data.message.eventName === 'hideChartClicked') {
              chartVisibleRef.current = false;
              // Remove iframe event listeners
              if (ref.current?.contentDocument) {
                const iframeDoc = ref.current.contentDocument;
                const listeners = iframeListenersRef.current;
                if (listeners.mousemove) {
                  iframeDoc.removeEventListener('mousemove', listeners.mousemove);
                }
                if (listeners.mousedown) {
                  iframeDoc.removeEventListener('mousedown', listeners.mousedown);
                }
                if (listeners.mouseup) {
                  iframeDoc.removeEventListener('mouseup', listeners.mouseup);
                }
                iframeListenersRef.current = {};
              }
              // Then signal to stop tracking
              const stopEvent = new Event('stopChartTracking', { bubbles: true, cancelable: true });
              window.dispatchEvent(stopEvent);
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [storeDispatch, dispatch, iframeId, currentConfig, sendMessage, setReactiveAnswers, updateResponseBlockValidation, identifier]);

  return (
    <iframe
      ref={ref}
      style={{ width: '100%', flexGrow: 1, border: 0 }}
      src={
        currentConfig.path.startsWith('http')
          ? currentConfig.path
          : `${BASE_PREFIX}${currentConfig.path}?trialid=${currentComponent}&id=${iframeId}`
      }
    />
  );
}
