// run.js
const { spawn } = require("child_process");

// Function to run a command in a specific directory
function runCommand(command, args, cwd) {
  const process = spawn(command, args, { cwd, stdio: "inherit", shell: true });

  process.on("close", (code) => {
    console.log(`[${cwd}] process exited with code ${code}`);
  });
}

// Run backend
runCommand("npm", ["start"], "backend");

// Run frontend
runCommand("npm", ["start"], "frontend");
