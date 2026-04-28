import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { StorageEngineProvider } from './storage/storageEngineHooks';
import { MouseTrackingProvider } from './store/hooks/MouseTrackingContext';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { GlobalConfigParser } from './GlobalConfigParser';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StorageEngineProvider>
      <MouseTrackingProvider>
        <MantineProvider>
          <Notifications />
          <GlobalConfigParser />
        </MantineProvider>
      </MouseTrackingProvider>
    </StorageEngineProvider>
  </React.StrictMode>,
);
