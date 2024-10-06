const cluster = require("cluster");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { RateLimiterMemory } = require("rate-limiter-flexible");
require("dotenv").config();

const numCPUs = 2;
const port = process.env.PORT;

const logFilePath = path.join(__dirname, process.env.LOG_FILE_PATH);

const rateLimiterPerSecond = new RateLimiterMemory({
  points: 1,
  duration: 1,
});

const rateLimiterPerMinute = new RateLimiterMemory({
  points: 20,
  duration: 60,
});

const userTaskQueues = {};

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is active`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(express.json());

  async function task(user_id, workerId) {
    const currentTime = new Date(Date.now()).toLocaleString();

    const logMessage = `${user_id} - task completed by worker ${workerId} at - ${currentTime}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error("Failed to write to log file:", err);
      }
    });

    console.log(logMessage);
  }

  function processUserQueue(user_id) {
    if (!userTaskQueues[user_id] || userTaskQueues[user_id].length === 0)
      return;

    const { workerId, res, taskResolve } = userTaskQueues[user_id].shift();

    task(user_id, workerId)
      .then(() => {
        res.status(200).json({
          message: `Task for user ${user_id} has been processed by worker ${workerId}.`,
        });
      })
      .finally(() => {
        taskResolve();
        if (userTaskQueues[user_id].length > 0) {
          processUserQueue(user_id);
        }
      });
  }

  app.post("/api/v1/task", async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
      await rateLimiterPerSecond.consume(user_id);
      await rateLimiterPerMinute.consume(user_id);

      await new Promise((resolve) => {
        if (!userTaskQueues[user_id]) userTaskQueues[user_id] = [];
        userTaskQueues[user_id].push({
          workerId: process.pid,
          res,
          taskResolve: resolve,
        });

        if (userTaskQueues[user_id].length === 1) {
          processUserQueue(user_id);
        }
      });
    } catch (rateLimiterRes) {
      res.status(429).json({
        message:
          "Too many requests. Your task has been queued and will be processed shortly.",
      });
    }
  });

  app.listen(port, () => {
    console.log(`Worker ${process.pid} is active, listening on port ${port}`);
  });
}
