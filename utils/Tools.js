const fs = require("fs");
const os = require("os");
const path = require("path");


class Tools {
    static MK_DIR_PATH(filepath) {
        var dirname = path.dirname(filepath);
        if (!fs.existsSync(dirname)) {
            Tools.MK_DIR_PATH(dirname);
        }
        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
        }
    }

    static ARE_SAME_FILES(filepath1, filepath2) {
        if (filepath1 === filepath2) {
            return true;
        }

        try {
            const stat1 = fs.statSync(filepath1, {bigint: true});
            const stat2 = fs.statSync(filepath2, {bigint: true});
            return (stat1.dev === stat2.dev && stat1.ino === stat2.ino);
        } catch (e) {
            return false;
        }
    }

    static GET_NETWORK_INTERFACES() {
        return Object.values(os.networkInterfaces())
            .flat()
            .filter(i => {
                return !i.mac.startsWith("00:00");
            });
    }

    static GET_CURRENT_HOST_IP_ADDRESSES() {
        const IPs = Tools
            .GET_NETWORK_INTERFACES()
            .map(i => {
                return i.address;
            });

        return [...new Set(IPs)]; // dedupe
    }

    static GET_CURRENT_HOST_IPV4_ADDRESSES() {
        const IPs = Tools
            .GET_NETWORK_INTERFACES()
            .filter(i => {
                return i.family === "IPv4";
            })
            .map(i => {
                return i.address;
            });

        return [...new Set(IPs)]; // dedupe
    }

    static CONVERT_BYTES_TO_HUMANS(bytes) {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(((bytes / 1024) / 1024) / 1024).toFixed(2)} GiB`;
        } else if (bytes >= 1024 * 1024) {
            return `${((bytes / 1024) / 1024).toFixed(2)} MiB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KiB`;
        } else {
            return `${bytes} bytes`;
        }
    }


    static GET_VERSION() {
        let version = "unknown";

        try {
            const rootDirectory = path.resolve(__dirname, "../");
            const packageContent = fs.readFileSync(rootDirectory + "/package.json", {"encoding": "utf-8"});

            if (packageContent) {
                version = JSON.parse(packageContent.toString()).version;
            }
        } catch (e) {
            //intentional
        }

        return version;
    }

    static GET_COMMIT_ID() {
        let commitId = "unknown";

        try {
            const rootDirectory = path.resolve(__dirname, "../");
            commitId = fs.readFileSync(rootDirectory + "/.git/HEAD", {"encoding": "utf-8"}).trim();

            if (commitId.match(/^ref: refs\/heads\/master$/) !== null) {
                commitId = fs.readFileSync(rootDirectory + "/.git/refs/heads/master", {"encoding": "utf-8"}).trim();
            }
        } catch (e) {
            //intentional
        }

        return commitId;
    }
}

module.exports = Tools;
