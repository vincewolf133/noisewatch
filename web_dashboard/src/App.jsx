import React, { useState, useEffect } from 'react';
import { ref, onValue, query, limitToLast, get } from 'firebase/database';
import { db } from './firebase';
import { Waves, SquaresFour, ChartLineUp } from '@phosphor-icons/react';
import SensorCard from './components/SensorCard';
import HistoryChart from './components/HistoryChart';
import Leaderboard from './components/Leaderboard';
import './App.css';

/**
 * SENSORS Configuration
 * @description Define the rooms and their unique visual branding (colors, IDs).
 * This array is used throughout the app to generate cards, charts, and table rows.
 */
const SENSORS = [
  { id: 1, name: "Room 1", color: "var(--accent-blue)", rgb: "0, 240, 255", hex: "#00f0ff" },
  { id: 2, name: "Room 2", color: "var(--accent-purple)", rgb: "138, 43, 226", hex: "#8a2be2" },
  { id: 3, name: "Room 3", color: "var(--accent-pink)", rgb: "255, 0, 127", hex: "#ff007f" },
  { id: 4, name: "Room 4", color: "var(--accent-orange)", rgb: "255, 170, 0", hex: "#ffaa00" }
];

/**
 * App Component
 * @description The root component of the Noisewatch Dashboard.
 * Manages global sensor data, Firebase real-time listeners, and view navigation.
 */
function App() {
  // State for which tab is currently visible ('dashboard' or 'history')
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // currentData: Stores the latest 'intensity' value for each sensor ID
  const [currentData, setCurrentData] = useState({});
  
  // historyData: Stores an array of the last 60 records for each sensor ID
  const [historyData, setHistoryData] = useState({});
  
  // highestValues: Tracks the peak frequency recorded during the current session
  const [highestValues, setHighestValues] = useState({});
  
  // lastAlerts: Used for throttling browser 'alert' notifications to avoid spam
  const [lastAlerts, setLastAlerts] = useState({});

  /**
   * Main Side Effect: Firebase Listeners
   * @description Attaches real-time listeners to Firebase RTDB on component mount.
   * Ensures data is automatically synced without page refreshes.
   */
  useEffect(() => {
    const unsubscriptions = [];

    SENSORS.forEach(sensor => {
      // 1. Current real-time data listener (/sensors/current)
      const currentRef = ref(db, `sensors/current/sensor${sensor.id}`);
      const unsubscribeCurrent = onValue(currentRef, (snapshot) => {
        const val = snapshot.val();
        if (val !== null) {
          // Update the live display
          setCurrentData(prev => ({ ...prev, [sensor.id]: val }));
          
          // Logic: Update highest values for the leaderboard
          setHighestValues(prev => {
            if (!prev[sensor.id] || val > prev[sensor.id]) {
              return { ...prev, [sensor.id]: val };
            }
            return prev;
          });

          // Logic: Handle High-Noise Alerts
          if (val >= 1000) {
            const now = Date.now();
            setLastAlerts(prev => {
              // Only alert if we haven't alerted for this sensor in the last 30 seconds
              if (!prev[sensor.id] || now - prev[sensor.id] > 30000) {
                console.warn(`CRITICAL NOISE: ${sensor.name} at ${val} triggers!`);
                alert(`CRITICAL NOISE detected in ${sensor.name}!\nFrequency: ${val} triggers/s`);
                return { ...prev, [sensor.id]: now };
              }
              return prev;
            });
          }
        }
      });
      unsubscriptions.push(unsubscribeCurrent);

      // 2. History data listener (/sensors/history - limited to last 60 items)
      const historyRef = query(ref(db, `sensors/history/sensor${sensor.id}`), limitToLast(60));
      const unsubscribeHistory = onValue(historyRef, (snapshot) => {
        const history = snapshot.val();
        if (history) {
          // Format raw Firebase objects into a sorted array for charts
          const formattedHistory = Object.keys(history).map(key => {
            const item = history[key];
            const timestamp = (item.timestamp && typeof item.timestamp === 'number') ? item.timestamp : Date.now();
            const date = new Date(timestamp);
            return {
              timestamp: date.toISOString(),
              time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              intensity: item.intensity || 0
            };
          }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); 
          
          setHistoryData(prev => ({ ...prev, [sensor.id]: formattedHistory }));
        }
      });
      unsubscriptions.push(unsubscribeHistory);
    });

    /**
     * Cleanup Function
     * @description Detaches all Firebase listeners when the component unmounts 
     * to prevent memory leaks and unnecessary network calls.
     */
    return () => {
      unsubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  /**
   * downloadCSV
   * @description Fetches the full history for a sensor and generates a downloadable CSV file.
   * @param {Number} sensorId - The ID of the sensor to export.
   */
  const downloadCSV = async (sensorId) => {
    const historyRef = ref(db, `sensors/history/sensor${sensorId}`);
    try {
      const snapshot = await get(historyRef);
      const history = snapshot.val();
      
      if (!history) {
        alert("No previous data available to download.");
        return;
      }

      // Construct CSV headers and rows
      let csvContent = "data:text/csv;charset=utf-8,Date,Time,Frequency\r\n";
      Object.keys(history).forEach(key => {
        const item = history[key];
        const timestamp = (item.timestamp && typeof item.timestamp === 'number') ? item.timestamp : Date.now();
        const date = new Date(timestamp);
        const dayStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        csvContent += `${dayStr},${timeStr},${item.intensity || 0}\r\n`;
      });

      // Browser utility: Trigger an automatic download of the generated file
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sensor_${sensorId}_history.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading history:", error);
      alert("Failed to download history.");
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Topbar */}
      <header className="topbar">
        <div className="logo">
          <Waves weight="fill" />
          <h1>Noisewatch</h1>
        </div>

        <div className="nav-tabs">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <SquaresFour /> Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <ChartLineUp /> History
          </button>
        </div>

        <div className="status-indicator">
          <span className="pulse"></span> Live Monitoring Active
        </div>
      </header>

      {/* View 1: Real-time Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="view-container">
          <Leaderboard sensors={SENSORS} highestValues={highestValues} />
          <main className="dashboard-grid">
            {SENSORS.map(sensor => (
              <SensorCard 
                key={sensor.id}
                sensor={sensor}
                intensity={currentData[sensor.id]}
                history={historyData[sensor.id] || []}
                onDownload={downloadCSV}
              />
            ))}
          </main>
        </div>
      )}

      {/* View 2: Detailed History Charts */}
      {activeTab === 'history' && (
        <div className="view-container">
          <main className="history-grid">
            {SENSORS.map(sensor => (
              <HistoryChart 
                key={sensor.id}
                sensor={sensor}
                history={historyData[sensor.id] || []}
                onDownload={downloadCSV}
              />
            ))}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
