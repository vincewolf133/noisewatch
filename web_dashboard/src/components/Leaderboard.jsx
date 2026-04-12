import React from 'react';
import { WarningCircle, SpeakerHigh, Trophy } from '@phosphor-icons/react';

/**
 * Leaderboard Component
 * 
 * @description Displays a ranked list of sensors based on their peak noise frequency.
 * Highlights the most active/noisy locations recorded during the session.
 * 
 * @param {Array} sensors - Initial sensor metadata.
 * @param {Object} highestValues - State object containing the peak intensity recorded for each sensor ID.
 */
const Leaderboard = ({ sensors, highestValues }) => {
  
  /**
   * getAlertStatus
   * @description Returns a stylized status badge based on the frequency value.
   * @param {Number} val - The frequency value to evaluate.
   */
  const getAlertStatus = (val) => {
    if (val >= 1000) return <span className="badge badge-critical">Critical</span>;
    if (val >= 500) return <span className="badge badge-warning">Caution</span>;
    return <span className="badge badge-safe">Normal</span>;
  };

  /**
   * sortedSensors
   * @description Creates a copy of the sensors array and sorts it in descending order 
   * based on the 'highestValues' (peak frequency) for each sensor.
   */
  const sortedSensors = [...sensors].sort((a, b) => 
    (highestValues[b.id] || 0) - (highestValues[a.id] || 0)
  );

  return (
    <section className="leaderboard-section">
      <h2 className="leaderboard-title">
        <Trophy weight="fill" color="var(--accent-orange)" /> 
        Peak Noise Frequency Rankings
      </h2>
      <div className="table-responsive">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Location</th>
              <th style={{ width: '30%' }}>Peak Frequency</th>
              <th style={{ width: '30%' }}>Current Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedSensors.map((sensor) => (
              <tr key={sensor.id}>
                <td style={{ fontWeight: 700, color: sensor.color }}>
                  <SpeakerHigh weight="fill" style={{ marginRight: '8px' }} /> 
                  {sensor.name}
                </td>
                <td style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'monospace' }}>
                  {/* Display the highest frequency recorded for this sensor */}
                  {highestValues[sensor.id] || 0}
                </td>
                <td>
                  {/* Map the frequency value to a visual status badge */}
                  {getAlertStatus(highestValues[sensor.id] || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Leaderboard;
