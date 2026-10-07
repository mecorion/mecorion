import {spawn} from "node:child_process";

const mode = process.argv[2];
if (!["required", "dev-admin", "dev-base"].includes(mode)) {
  console.error("Unknown API development mode");
  process.exit(1);
}

const env = {...process.env, AUTH_MODE: mode === "required" ? "required" : "dev-bypass"};
if (mode !== "required") {
  Object.assign(env, {NODE_ENV: "development", DEV_AUTH_ACCOUNT: mode, JWT_MODE: "secret"});
}

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("Run this script through npm.");
  process.exit(1);
}

const child = spawn(process.execPath, [npmCli, "--workspace", "@mecorion/api", "run", "dev"], {
  env,
  stdio: "inherit",
});
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
