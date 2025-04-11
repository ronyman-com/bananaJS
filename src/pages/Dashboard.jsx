// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const Dashboard = () => {
  const { isConnected, buildMetrics, send } = useWebSocket();
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [hmrUpdates, setHmrUpdates] = useState([]);

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('Connected to HMR server');
      // Request initial build metrics
      send({ type: 'request-metrics' });
    } else {
      setConnectionStatus('Disconnected - attempting to reconnect...');
    }
  }, [isConnected, send]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!isConnected) return;

    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'update') {
          setHmrUpdates(prev => [
            ...prev.slice(-9), // Keep last 10 updates
            { file: message.file, time: message.time }
          ]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    return () => {
      // Cleanup message handler if needed
    };
  }, [isConnected]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Development Dashboard</h2>
      
      {/* Connection Status */}
      <div className={`p-3 mb-4 rounded ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {connectionStatus}
      </div>

      {/* Build Metrics */}
      {buildMetrics && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Build Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Last Build Time</p>
              <p className="font-mono">{buildMetrics.buildTime || '--'} ms</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Last HMR Update</p>
              <p className="font-mono">{buildMetrics.hmrUpdateTime || '--'} ms</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {hmrUpdates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Updates</h3>
          <ul className="space-y-2">
            {hmrUpdates.map((update, index) => (
              <li key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-mono text-sm text-gray-600">{update.file}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {update.time} ms
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;