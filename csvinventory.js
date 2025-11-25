"use strict";


module.exports.csvinventory = function (parent) {
    const obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.VIEWS = __dirname + '/views/';

    const path = require("path");
    const fs = require("fs");
    const cp = require("child_process");
    const util = require("util");
    obj.dir = path.join(__dirname, "../../../meshcentral-files", "domain");

    const exec = util.promisify(cp.exec);
    let userFolder = "";
    let userPath = "";

    let objArray = [];

    let loginInfo = fs.existsSync(path.join(__dirname, "/config/config.json")) ? JSON.parse(fs.readFileSync(path.join(__dirname, "/config/config.json"))) : 0;
    let user_uname = loginInfo.user_login_token_username || "";
    let user_upass = loginInfo.user_login_token_password || "";
    let FILE_NAME = loginInfo.file_name || "DevicesInfo.csv";

    obj.server_startup = async function () {

        await obj.meshServer.webserver.app.route("/plugin/csvinventory/savefile")
            .post((req, res) => {
                res.download(userPath);
            })

        await obj.meshServer.webserver.app.route("/plugin/csvinventory/file")
            .post((req, res) => {
                let body = "";
                req.on("data", data => body = data)
                req.on("end", async () => {
                    try {

                        let header = "";
                        const listDev = await exec(`node node_modules/meshcentral/meshctrl listDevices --loginuser ${user_uname} --loginpass ${user_upass} --json `);

                        for await (const con of JSON.parse(listDev.stdout)) {
                            await obj.usersInfo(con);
                        }

                        const headerInfo = Object.keys(objArray[0]);


                        for await (const hI of headerInfo) {
                            header += hI + ";";
                        }

                        header += "\n"
                        try {


                            await fs.promises.writeFile(userPath, header, { flag: "w", encoding: "utf8" })

                            for await (const obj of objArray) {
                                await fs.promises.writeFile(userPath, `${obj["type"]};${obj["mtype"]};${obj["_id"]};${obj["meshid"]};${obj["groupname"]};${obj["agentver"]};${obj["agentid"]};${obj["agentcaps"]};${obj["agentcore"]};${obj["agentroot"]};${obj["wscantiVirus"]};${obj["wscautoUpdate"]};${obj["wscfirewall"]};${obj["antiVirus"]};${obj["osdesc"]};${obj["lastbootupdate"]};${obj["users"]};${obj["ServerName"]};${obj["ComputerName"]};${obj["Hostname"]};${obj["IPAddress"]};${obj["Icon"]};${obj["OSName"]};${obj["OSVersion"]};${obj["OSArchitecture"]};${obj["AGENTMeshAgent"]};${obj["AGENTLastagentconnection"]};${obj["AGENTLastagentaddress"]};${obj["Network"]};${obj["BIOSVendor"]};${obj["BIOSVersion"]};${obj["MotherboardVendor"]};${obj["MotherboardName"]};${obj["MotherboardSerial"]};${obj["MotherboardVersion"]};${obj["MotherboardIdentifier"]};${obj["MotherboardCPU"]};${obj["MotherboardGPU1"]};${obj["Memory"]};${obj["TotalMemory"]};${obj["Storage"]};${obj["TotalStorage"]};\n`, { flag: "a", encoding: "utf8" })
                            }
                            console.log("CSV INVENTORY -> FILE INSERTED WITH SUCCESS");

                            objArray = [];
                            res.end();
                        } catch (error) {
                            console.log(error);

                        }

                    } catch (error) {
                        console.log(error);

                    }
                })
            })


        await obj.meshServer.webserver.app.route("/plugin/csvinventory/config")
            .post((req, res) => {
                let body = "";
                req.on("data", data => body += data)
                req.on("end", async () => {
                    try {

                        const cfgInfo = JSON.parse(body.toString())

                        const testCred = await exec(`node node_modules/meshcentral/meshctrl devicemessage --id --msg --loginuser ${cfgInfo.user_login_token_username} --loginpass ${cfgInfo.user_login_token_password}`)


                        if (!testCred.stdout.includes("Invalid")) {

                            if (!fs.existsSync(path.join(__dirname, "config"))) {
                                await fs.promises.mkdir(path.join(__dirname, "config"))

                            }


                            await fs.promises.writeFile(path.join(__dirname, "config", "config.json"), JSON.stringify(cfgInfo), {
                                encoding: "utf8",
                                flag: "w"
                            })

                            user_uname = cfgInfo.user_login_token_username || "";
                            user_upass = cfgInfo.user_login_token_password || "";
                            res.sendStatus(200);

                        } else {
                            res.sendStatus(401);
                        }
                    } catch (err) {
                        console.log(err);

                    }
                })
            })


    }


    obj.usersInfo = async function (info) {
        try {


            const listDevInf = await exec(`node "./node_modules/meshcentral/meshctrl" deviceinfo --id ${info._id} --loginuser ${user_uname} --loginpass ${user_upass} --json `);


            const nObj = {
                type: "",
                mtype: "",
                _id: "",
                meshid: "",
                groupname: "",
                agentver: "",
                agentid: "",
                agentcaps: "",
                agentcore: "",
                agentroot: "",
                wscantiVirus: "",
                wscautoUpdate: "",
                wscfirewall: "",
                antiVirus: "",
                osdesc: "",
                lastbootupdate: "",
                users: "",
                ServerName: "",
                ComputerName: "",
                Hostname: "",
                IPAddress: "",
                Icon: "",
                OSName: "",
                OSVersion: "",
                OSArchitecture: "",
                AGENTMeshAgent: "",
                AGENTLastagentconnection: "",
                AGENTLastagentaddress: "",
                Network: "",
                BIOSVendor: "",
                BIOSVersion: "",
                MotherboardVendor: "",
                MotherboardName: "",
                MotherboardSerial: "",
                MotherboardVersion: "",
                MotherboardIdentifier: "",
                MotherboardCPU: "",
                MotherboardGPU1: "",
                Memory: "",
                TotalMemory: 0,
                Storage: "",
                TotalStorage: 0,
            }


            nObj.type = info["type"];
            nObj.mtype = info["mtype"];
            nObj._id = info["_id"];
            nObj.meshid = info["meshid"];
            nObj.groupname = info["groupname"];

            nObj.osdesc = info["osdesc"];
            nObj.lastbootupdate = (new Date(info["lastbootuptime"]).toLocaleString());
            nObj.users = info["users"].map(k => k).join(" | ");

            // Object.values(await JSON.parse(listDevInf.stdout)["Memory"]).map((a) => console.log(a));
            const mthb = Object.keys(JSON.parse(listDevInf.stdout)["Motherboard"] || "");
            const net = Object.keys(JSON.parse(listDevInf.stdout)["Networking"] || "");
            const mem = Object.keys(JSON.parse(listDevInf.stdout)["Memory"] || "");
            const strg = Object.keys(JSON.parse(listDevInf.stdout)["Storage"] || "");
            const bios = Object.keys(JSON.parse(listDevInf.stdout)["BIOS"] || "");
            const mAgent = Object.keys(JSON.parse(listDevInf.stdout)["Mesh Agent"] || "");
            const osI = Object.keys(JSON.parse(listDevInf.stdout)["Operating System"] || "");
            const gen = Object.keys(JSON.parse(listDevInf.stdout)["General"] || "");
            const agent = Object.keys(info["agent"]) || "";
            const av = Object.keys(info["av"]) || "";
            const wsa = Object.keys(info["wsc"]) || "";




            for await (const agentValues of agent) {
                nObj["agent" + agentValues] = info["agent"][agentValues]
            }




            for await (const wsaValues of wsa) {
                nObj["wsc" + wsaValues] = info["wsc"][wsaValues]
            }

            for await (const avValues of av) {

                nObj.antiVirus += Object.values(info["av"]).map(v => "product: " + v["product"] + ", updated: " + v["updated"] + ", enabled: " + v["enabled"]).join("|")

            }

            for await (const genValues of gen) {
                if (!(Array.isArray(JSON.parse(listDevInf.stdout)["General"][genValues]) || genValues === "WindowsSecurityCenter"))
                    nObj[genValues.replace(" ", "")] = JSON.parse(listDevInf.stdout)["General"][genValues];
            }


            for await (const osValues of osI) {
                nObj["OS" + osValues] = JSON.parse(listDevInf.stdout)["Operating System"][osValues];
            }


            for await (const agentValues of mAgent) {
                nObj["AGENT" + agentValues.replaceAll(" ", "")] = JSON.parse(listDevInf.stdout)["Mesh Agent"][agentValues];
            }

            for await (const biosValues of bios) {
                nObj["BIOS" + biosValues] = JSON.parse(listDevInf.stdout)["BIOS"][biosValues];
            }


            for await (const mthValues of mthb) {
                nObj["Motherboard" + mthValues] = JSON.parse(listDevInf.stdout)["Motherboard"][mthValues];
            }

            for await (const memValues of mem) {
                nObj.Memory += memValues + "->" + Object.values(JSON.parse(listDevInf.stdout)["Memory"][memValues]).map(v => v).join("|") + "// "
                nObj.TotalMemory += Number(String(JSON.parse(listDevInf.stdout)["Memory"][memValues]["Capacity/Speed"]).split(" ")[0]);
                // console.log(0+=Number.parseInt(nObj.Memory.split("->")[1].split(",")[0].split(" ")[0]));

            }


            nObj.TotalMemory += " Mb";

            for await (const netValues of net) {
                nObj.Network += netValues + "->" + Object.values(JSON.parse(listDevInf.stdout)["Networking"][netValues]).map(v => v).join("|") + " //"
            }


            for await (const strgValues of strg) {
                nObj.Storage += strgValues + "->" + Object.values(JSON.parse(listDevInf.stdout)["Storage"][strgValues]).map(v => v).join("|") + " //"
                nObj.TotalStorage += Number(String(JSON.parse(listDevInf.stdout)["Storage"][strgValues]["Capacity"]).split("M")[0]);
            }

            nObj.TotalStorage += " Mb"

            // console.log(nObj);
            objArray.push(nObj);

        } catch (error) {
            console.log(error);

        }


    }


    obj.handleAdminReq = function (req, res, user) {
        userFolder = user["_id"].replace("//", "-");

        userPath = path.join(obj.dir, userFolder, "Public", FILE_NAME);


        if (!user || user.siteadmin !== 0xFFFFFFFF) {
            res.status(403).send("CSV Inventory -> Denied");
            return
        }

        res.render(obj.VIEWS + "main.handlebars", { title: "CSV Inventory", ex: fs.existsSync(path.join(__dirname, "/config/config.json")), user: userFolder, file_name: FILE_NAME })
    }


    obj.hook_webServer = function (req, res, next) {
        if (req.path === "/csvinventory/") {
            obj.handleAdminReq(req, res, req.session.user);
            return;
        }
        next();
    }


    return obj;
}