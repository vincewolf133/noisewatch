import React from 'react';
import { Line } from 'react-chartjs-2';
import { SpeakerHigh, DownloadSimple } from '@phosphor-icons/react';

/**
 * SensorCard Component
 * 
 * @description Renders a real-time summary card for a specific sensor.
 * Includes a live intensity value and a mini-trend chart.
 * 
 * @param {Object} sensor - Metadata for the sensor (id, name, color, hex, rgb).
 * @param {Number} intensity - The current real-time noise frequency (triggers/s).
 * @param {Array} history - Array of recent history data points for the mini-chart.
 * @param {Function} onDownload - Callback to trigger CSV export for this sensor ID.
 */
const SensorCard = ({ sensor, intensity, history, onDownload }) => {
  
  /**
   * displayIntensity
   * @description Normalizes the intensity value to ensure it's a number (defaults to 0).
   */
  const displayIntensity = (intensity !== undefined && intensity !== null) ? intensity : 0;
  
  /**
   * chartData
   * @description Configures the data source for the mini-chart overlay.
   */
  const chartData = {
    labels: history.map(h => h.time),
    datasets: [{
      label: 'Frequency',
      data: history.map(h => h.intensity),
      borderColor: sensor.hex,
      // Create a background gradient for the mini area chart
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `rgba(${sensor.rgb}, 0.4)`);
        gradient.addColorStop(1, `rgba(${sensor.rgb}, 0.0)`);
        return gradient;
      },
      borderWidth: 3,
      pointRadius: 0, // No points on the mini-chart for a cleaner look
      pointHoverRadius: 6,
      pointBackgroundColor: sensor.hex,
      fill: true,
      tension: 0.45
    }]
  };

  /**
   * chartOptions
   * @description Visual and interaction configuration for the mini-chart.
   */
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, // Hide legend to save space
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(5, 7, 10, 0.9)',
        padding: 12,
        cornerRadius: 10,
        displayColors: false
      }
    },
    scales: {
      x: { display: false }, // Hide X axis
      y: { 
        display: false,      // Hide Y axis
        min: 0,
        suggestedMax: 100 
      }
    },
    interaction: { mode: 'index', intersect: false }
  };

  return (
    <div className="sensor-card">
      <div className="card-header">
        <div className="card-title" style={{ color: sensor.color }}>
          <SpeakerHigh weight="fill" className="card-icon" />
          {sensor.name}
        </div>
        {/* Trigger the shared download logic for this specific sensor */}
        <button className="download-btn" onClick={() => onDownload(sensor.id)}>
          <DownloadSimple weight="bold" /> Export
        </button>
      </div>
      <div className="intensity-display">
        {/* Large real-time value display */}
        <span className="intensity-value" style={{ color: sensor.color }}>
          {displayIntensity}
        </span>
        <span className="intensity-unit">Triggers / Second</span>
      </div>
      <div className="chart-container-mini">
        {/* Mini line chart showing recent trends */}
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default SensorCard;
