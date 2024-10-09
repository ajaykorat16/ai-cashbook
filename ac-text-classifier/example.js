const { spawn } = require("child_process");

function runPythonScript(operation, userId, filePath, outputFilePath = null) {
  const args = ["main.py", operation, userId, filePath];
  if (outputFilePath) {
    args.push(outputFilePath);
  }
  const pythonProcess = spawn("python", args);
  pythonProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
  pythonProcess.on("error", (error) => {
    console.error(`Error starting Python script: ${error.message}`);
  });
  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
    } else {
      console.log("Python script finished successfully");
    }
  });
}

const operation = "classify"; // or 'train'
const userId = "12";
const filePath = "./data/input.csv";
const outputFilePath = "./data/output.csv";

runPythonScript(operation, userId, filePath, outputFilePath);
