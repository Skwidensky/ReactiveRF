import express from 'express';
const app = express();
import osu from 'node-os-utils'
import http from 'http';
import protobuf from 'protobufjs';
import { Server } from 'socket.io';
import si from 'systeminformation'
import callback_api from 'amqplib';
import kafka from 'kafka-node'

const schema = `
  syntax = "proto3";

  message GeneratedData {
	int64 timestamp = 1;
	repeated double rf_frame_imag = 2 [packed=true];
	repeated double rf_frame_real = 3 [packed=true];
	repeated double rf_frame_psd = 4 [packed=true];
  }
`;
const root = protobuf.parse(schema).root;
const cpu = osu.cpu;

var channel: any;
var cpuName = await si.cpu().then(data => { return data['brand'] });
var cpuCores = cpu.count();

start();

async function getCpuUsage() {
    var cpuUsage;
    await cpu.usage().then(cpu_usage => {
        cpuUsage = cpu_usage;
    });
    return cpuUsage;
}

function start() {
    console.log("Starting server");
    // getCpuUsage().then(cpuUsage => console.log(cpuUsage));

    // const client = new kafka.KafkaClient();
    // const consumer = new kafka.Consumer(
    //     client,
    //     [
    //         { topic: 'hello-world', partition: 0 }
    //     ],
    //     {
    //         autoCommit: false
    //     }
    // );

    // consumer.on('message', function (message) {
    //     console.log(message);
    // });

    // #region RabbitMQ
    callback_api.connect("amqp://guest:guest@localhost:5672/")
        .then(function (conn) {
            console.log("Creating AMQP channel");
            var ch = conn.createChannel();
            return ch;
        })
        .then(function (ch) {
            console.log("Consuming channel");
            channel = ch;
            // ch.assertQueue('frontend-to-prediction-service');
            ch.consume('queue-one', handleRfMessage);
        })
        .catch(function (err) {
            console.log("ERROR: ", err.message);
        });
    // #endregion RabbitMQ

    // #region handlers
    async function handleRfMessage(msg: any) {
        const GeneratedData = root.lookupType('GeneratedData');
        const decodedMessage = GeneratedData.decode(msg.content);
        const jsonMessage = GeneratedData.toObject(decodedMessage);
        const timeSinceBirth = Date.now() - jsonMessage['timestamp'];

        const values = [];
        const real = jsonMessage['rfFrameReal'];
        const imag = jsonMessage['rfFrameImag'];

        for (let i = 0; i < real.length; i++) {
            values.push(`{ "x": ${real[i]}, "y": ${imag[i]}}`)
        }
        console.log(timeSinceBirth);
        const ret = `{ "data": [ { "id": "ONE", "values": [${values}]} ], "labels": { "x": "Real", "y": "Imaginary" } }`
        io.emit('generated data message', ret);
        channel.ack(msg);
    }
    // #endregion handlers

    // #region API
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
        express.urlencoded({ extended: true })
        next();
    });

    app.use(express.static('public'));
    app.use(express.static('dist'));
    var server = http.createServer(app);

    var io = new Server(server);
    io.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
    io.on("disconnect", () => {
        console.log('Socket disconnected');
    });
    server.listen(4003, function () {
        console.log("Express server listening on port " + 4003);
    });
    // #endregion API
}