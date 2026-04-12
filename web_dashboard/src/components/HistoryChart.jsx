import React from 'react';
import { Line } from 'react-chartjs-2';
import { SpeakerHigh, DownloadSimple } from '@phosphor-icons/react';

/**
 * HistoryChart Component
 * 
 * @description Renders a detailed historical line chart for a specific sensor.
 * Used in the "History" tab to show long-term noise trends.
 * 
 * @param {Object} sensor - The sensor configuration (id, name, color, hex, rgb).
 * @param {Array} history - Array of historical data points (time, intensity).
 * @param {Function} onDownload - Callback function to trigger CSV export for this sensor.
 */
const HistoryChart = ({ sensor, history, onDownload }) => {
  
  // chartData: Configures the labels (time) and datasets (intensity values) for Chart.js
  const chartData = {
    labels: history.map(h => h.time),
    datasets: [{
      label: 'Triggers/s',
      data: history.map(h => h.intensity),
      borderColor: sensor.hex,
      // Create a linear gradient for the area under the line
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `rgba(${sensor.rgb}, 0.2)`);
        gradient.addColorStop(1, `rgba(${sensor.rgb}, 0.0)`);
        return gradient;
      },
      borderWidth: 2,
      pointBackgroundColor: sensor.hex,
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointRadius: 3,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.3 // Smoothness of the line
    }]
  };

  // chartOptions: Configures the visual appearance and interaction behavior of the chart
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, // Hide the default legend for a cleaner UI
      tooltip: {
        backgroundColor: 'rgba(5, 7, 10, 0.95)',
        titleColor: '#fff',
        bodyColor: sensor.hex,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    scales: {
      x: { 
        display: true,
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: { 
        display: true, 
        min: 0,
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    },
    interaction: { mode: 'index', intersect: false }
  };

  return (
    <div className="history-card">
      <div className="history-header">
        <div className="history-title" style={{ color: sensor.color }}>
          <SpeakerHigh weight="fill" color={sensor.color} />
          {sensor.name} History
        </div>
        {/* Trigger the CSV download for this specific sensor ID */}
        <button className="download-btn" onClick={() => onDownload(sensor.id)}>
          <DownloadSimple weight="bold" /> CSV
        </button>
      </div>
      <div className="chart-container-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default HistoryChart;
