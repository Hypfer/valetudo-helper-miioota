const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Tools = require("../utils/Tools");
const dgram = require("dgram");
const MiioSocket = require("../miio/MiioSocket");
const express = require("express");
const Codec = require("../miio/Codec");

const HELO = Buffer.from("21310020ffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "hex");



module.exports = async (filePath) => {
    const pathToFirmwareImage = path.resolve(filePath);
    if(!fs.existsSync(pathToFirmwareImage)) {
        console.error(`ERROR: "${pathToFirmwareImage}" does not exist.`);

        console.log("\n\nExiting..");
        process.exit(-1);
    }

    console.log("Starting installer.");
    console.log("If you experience issues, make sure to disable your firewall and/or VPN.");
    console.log("Also, make sure that the robot is docked during the firmware update procedure.");
    console.log("If the install still fails, try turning the robot off and back on again and/or moving the laptop closer to it.\n");



    const ourIP = Tools.GET_CURRENT_HOST_IPV4_ADDRESSES().filter(ip => ip.startsWith("192.168.8."))?.[0];
    if(!ourIP) {
        console.error("ERROR: There's no network interface with an IPv4 address in 192.168.8.0/24.");
        console.error("We're not connected to the robots Wi-Fi Access Point");

        console.log("\n\nExiting..");
        process.exit(-1);
    }


    const discoveredInstances = [];
    const discoverySocket = dgram.createSocket("udp4");
    discoverySocket.bind();

    discoverySocket.on("listening", () => {
        discoverySocket.setBroadcast(true); //required for linux

        console.log("Robot discovery started...");

        discoverySocket.send(HELO, MiioSocket.PORT, "192.168.8.255");

        setTimeout(() => {
            discoverySocket.send(HELO, MiioSocket.PORT, "192.168.8.255");
        }, 1000);

        setTimeout(() => {
            discoverySocket.send(HELO, MiioSocket.PORT, "192.168.8.255");
        }, 3000);

    })

    discoverySocket.on("message", (incomingMsg, rinfo) => {
        const codec = new Codec({token: Buffer.from("ffffffffffffffffffffffffffffffff")});
        let decoded;

        try {
            decoded = codec.decodeIncomingMiioPacket(incomingMsg);
        } catch(e) {
            console.error("Error while decoding discovery response", {
                err: e,
                rinfo: rinfo,
                incomingMsg: incomingMsg
            });

            return;
        }

        if(!discoveredInstances.find(i => i.deviceId === decoded.deviceId)) {
            discoveredInstances.push({
                deviceId: decoded.deviceId,
                token: decoded.token,
                address: rinfo.address
            });

            //console.log(`Discovered ${discoveredInstances.length} robots...`);
        }
    });


    setTimeout(() => {
        console.log(`Scan done.`);

        if (discoveredInstances.length === 1) {
            const instance = discoveredInstances[0];

            if (instance.token.toString("hex") === "ffffffffffffffffffffffffffffffff") {
                console.error("ERROR: Discovered token is invalid. Please factory-reset the robot first");

                console.log("Exiting..");

                process.exit(-1);
            }

            console.log(`Successfully discovered robot at ${instance.address}`);


            console.log("Reading firmware image..");

            const firmwareFile = fs.readFileSync(filePath);
            
            if (firmwareFile[0] === 0x1F && firmwareFile[1] === 0x8B) { //GZIP magic bytes
                console.error("ERROR: Invalid firmware image. Make sure to use a .pkg file.");

                console.log("Exiting..");

                process.exit(-1);
            }
            
            
            const md5 = crypto.createHash("md5").update(firmwareFile).digest("hex");

            console.log(`Successfully read firmware image. Size: ${Tools.CONVERT_BYTES_TO_HUMANS(firmwareFile.length)} MD5Sum: ${md5}`);



            const socket = dgram.createSocket("udp4");
            socket.bind();

            const miioSock = new MiioSocket({
                socket: socket,
                token: instance.token,
                deviceId: instance.deviceId,
                rinfo: {address: instance.address, port: MiioSocket.PORT},
                timeout: 5000,
                name: "local",
                isCloudSocket: false
            });



            const expressApp = express();
            let downloadStarted = false;

            let downloadTimeout = setTimeout(() => {
                console.error(`ERROR: Did not receive a firmware download request after 30s`);

                console.log("\n\nExiting..");

                process.exit(-1);
            }, 30000);

            expressApp.get("/firmware", (req, res) => {
                console.log(`Received firmware download request from ${req.ip}..`);

                downloadStarted = true;
                clearTimeout(downloadTimeout);

                res.send(firmwareFile);
            });




            let downloadUrl;
            const server = expressApp.listen(0, () => {
                downloadUrl = `http://${ourIP}:${server.address().port}/firmware`;

                console.log("");
                console.log(`Listing for firmware download requests on ${downloadUrl}`);

                (async () => {
                    try {
                        const res = await miioSock.sendMessage({
                            "method": "miIO.ota",
                            "params": {
                                "mode":"normal",
                                "install":"1",
                                "app_url": downloadUrl,
                                "file_md5": md5,
                                "proc":"dnld install"
                            }
                        });

                        console.log("Response from robot:", res);
                    } catch(e) {
                        console.error("ERROR: Error while sending update command to robot\nError:");
                        console.error(e);

                        console.log("\n\nExiting..");

                        process.exit(-1);
                    }
                })()
            });

            setInterval(() => {
                if (downloadStarted === true) {
                    server.getConnections((err, count) => {
                        if (!err && count === 0) {
                            console.log("");
                            console.log("Download seems to have finished.");
                            console.log("The robot should now install the firmware. It will take 5-10 minutes.")

                            console.log("Exiting..");

                            process.exit(0);
                        }
                    })
                }
            }, 1000);


        } else if (discoveredInstances.length > 1) {
            console.error("ERROR: Found more than one robot. WTF");

            console.log("Exiting..");

            process.exit(-1);
        } else {
            console.error("ERROR: No robot found");

            console.log("Exiting..");

            process.exit(-1);
        }
    }, 5000);
}
