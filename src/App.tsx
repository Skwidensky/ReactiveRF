import React, { useEffect, useState } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import ReactSignalsPlot from 'react-signals-plot';

var canvas: any = document.createElement("canvas");
// create an offscreen canvas
var ctx = canvas.getContext("2d");
const width = 800
const height = 600;

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [lineData, setLineData] = useState({});

  useEffect(() => {
    if (!isLoaded) {
      const socket = io("http://localhost:4003", {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        secure: false
      })
        .on('generated data message', handleGeneratedDataMessage);
    }
    updateImgSrc();
    setIsLoaded(true);
  }, []);

  function handleGeneratedDataMessage(msg: any) {
    console.log(JSON.parse(msg))
    setLineData(JSON.parse(msg));
  }

  function updateImgSrc() {
    // let normalizedPoints: any[] = [];
    // width = msg.normalizedDatum.length;
    // for (let i = 0; i < width; i++) {
    //   normalizedPoints.push(msg.normalizedDatum[i]);
    // }
    // if (normalizedImgData.length > 600) {
    //     normalizedImgData.shift();
    // }
    // normalizedImgData.push(normalizedPoints);
    // height = normalizedImgData.length;

    // size the canvas to your desired image
    canvas.width = width;
    canvas.height = height;
    if (ctx != undefined) {
      redrawSpectrogram();
    }
  }

  function redrawSpectrogram() {
    // get the imageData and pixel array from the canvas
    var imgData = ctx.getImageData(0, 0, width, height);
    var data = imgData.data;
    var flatArr = [];
    // var flatArr = normalizedImgData.flat();
    // manipulate pixel elements
    for (var i = 0; i < width * height; i += 1) {
      data[(i * 4)] = 128; // R
      data[(i * 4) + 1] = 0; // G
      data[(i * 4) + 2] = 0; // B
      data[(i * 4) + 3] = 255; // A
    }

    // put the modified pixels back on the canvas
    ctx.putImageData(imgData, 0, 0);
    setImgSrc(canvas.toDataURL());
  }


  return (
    <div className="App">
      <div>
        <ReactSignalsPlot
          style={{ width: 1000, height: 400 }}
          data={lineData["data"]}
          samplesLimit={300}
          labels={lineData["labels"]}
          interactive={true}
        />
      </div>
      <div style={{ width: '95%', display: 'inline-block' }}>
        <img src={imgSrc} style={{ width: 800, height: 600 }}></img>
      </div>
    </div>
  );
}

export default App;
