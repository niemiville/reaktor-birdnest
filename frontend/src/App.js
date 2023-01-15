
import React, { useState, useEffect } from 'react'
import './App.css';
import { getViolations } from './services/services';

function App() {
  const [violations, setViolations] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      getViolations().then(violations =>
        setViolations(violations)
      )  
    }, 5000);
    return () => clearInterval(interval);
  }, [])

  return (
    <div>
      <h1>Birdnest</h1>
      <ul>
        {violations.map((v) => 
          <li key={v.serialNumber}>{v.firstName} {v.lastName} {v.lastSeen} {v.closestDistanceToNest} {v.phoneNumber} {v.email}</li>
        )}
      </ul>
    </div>
  );
}

export default App;
