import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastBridge } from './components/ToastBridge';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="light">
        <Notifications position="top-right" zIndex={1000} />
        <ToastBridge />
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
);
