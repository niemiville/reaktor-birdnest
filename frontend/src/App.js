import logo from './logo.svg';
import React, { useState, useEffect } from 'react'
import './App.css';
import { getAllDrones } from './services/services';

function App() {
  const [drones, setDrones] = useState({})

  useEffect(() => {
    const interval = setInterval(() => {
      getAllDrones().then(drones =>
        setDrones(drones)
      )  
    }, 10000);
    return () => clearInterval(interval);
  }, [])
  
  return (
    <div>
      <h1>Birdnest</h1>
    </div>
  );
}

export default App;
