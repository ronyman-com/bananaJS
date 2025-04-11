import { useEffect, useCallback, useState } from 'react';

export function useWebSocket() {
  const [socket, setSocket] = useState(null);
  const [buildMetrics, setBuildMetrics] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to HMR server');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'metrics') {
          setBuildMetrics(message.data);
        }
        // Handle other message types
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from HMR server');
      // Attempt reconnect after delay
      setTimeout(connect, 3000);
    };

    setSocket(ws);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const send = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return { socket, isConnected, buildMetrics, send };
}