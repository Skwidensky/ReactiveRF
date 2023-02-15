import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { io, Socket } from 'socket.io-client';

function handleGeneratedDataMessage(msg: any) {
  console.log("Got it")
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      const socket = io("http://0.0.0.0:4003", {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        secure: false
      })
        .on('generated data message', handleGeneratedDataMessage);
    }
    setIsLoaded(true);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
