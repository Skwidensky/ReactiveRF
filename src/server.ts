import express from 'express';
const app = express();
import http from 'http';
import protobuf from 'protobufjs';
import { Server } from 'socket.io';
import callback_api from 'amqplib';
import kafka from 'kafka-node'

var channel: any;

start();
function start() {
    console.log("Starting server");
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

    async function handleRfMessage(msg: any) {
        // console.log("Handling RMQ GeneratedData message");
        protobuf.load("src/protos/generated-data.proto", function (err, root: any) {
            if (err) throw err;
            const GeneratedData = root.lookupType('protopackage.GeneratedData');
            const obj = GeneratedData.decode(Array.from(msg.content));
            io.emit('generated data message', obj);
            channel.ack(msg);
        });
    }

    // #region API
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
        express.urlencoded({ extended: true })
        next();
    });
    app.use(express.static('public'));
    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: 'public' });
    });
    var server = http.createServer(app);

    var io = new Server(server);
    io.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
    io.on('connection', (sock) => {
        console.log('Socket connection established (server.ts) -- ' + sock);
    });
    io.on("disconnect", () => {
        console.log('Socket disconnected');
    });
    server.listen(4003, function () {
        console.log("Express server listening on port " + 4003);
    });
}
// #endregion API