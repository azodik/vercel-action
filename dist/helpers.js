import * as core from "@actions/core";
import { spawn } from "child_process";
const execCmd = (command, args, cwd) => {
    core.debug(`EXEC: "${command} ${args}" in ${cwd || "."}`);
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, { cwd });
        let stdout = "";
        let stderr = "";
        process.stdout.on("data", (data) => {
            core.debug(data.toString());
            if (data !== undefined && data.length > 0) {
                stdout += data;
            }
        });
        process.stderr.on("data", (data) => {
            core.debug(data.toString());
            if (data !== undefined && data.length > 0) {
                stderr += data;
            }
        });
        process.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(stderr));
            }
            else {
                resolve(stdout.trim());
            }
        });
    });
};
const addSchema = (url) => {
    const regex = /^https?:\/\//;
    if (!regex.test(url)) {
        return `https://${url}`;
    }
    return url;
};
const removeSchema = (url) => {
    const regex = /^https?:\/\//;
    return url.replace(regex, "");
};
export { execCmd as exec, addSchema, removeSchema };
//# sourceMappingURL=helpers.js.map