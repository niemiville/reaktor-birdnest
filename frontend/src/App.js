import React, { useState, useEffect } from 'react'
import './birdnestStyles.css'
import { getViolations } from './services/services';

function App() {
  const [violations, setViolations] = useState([])
  const DATA_REFRESH_INTERVAL = 10000;
  
  useEffect(() => {
    getViolations().then(violations =>
      setViolations(violations)
    )
    const interval = setInterval(() => {
      getViolations().then(violations =>
        setViolations(violations)
      )  
    }, DATA_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [])

  return (
    <div>
      <h1>Birdnest No Drone Zone Violators</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Last seen</th>
            <th>Closest distance to the nest</th>
            <th>Phone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((v) => 
            <tr key={v.serialNumber}>
              <td>{v.firstName} {v.lastName}</td> 
              <td>{v.lastSeen}</td>
              <td>{(parseInt(v.closestDistanceToNest, 10)/1000).toFixed(2)} meters</td>
              <td>{v.phoneNumber}</td>
              <td>{v.email}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
