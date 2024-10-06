Node Assignment: User Task Queuing with Rate Limiting

1. General Overview
   This API is built using Express and cluster to handle user tasks with user-based rate limiting and a task queue mechanism. Each user can submit tasks, which are processed at the following rates:
   1 task per second
   20 tasks per minute
   Requests exceeding these limits are queued and processed in sequence. The API logs task completions to a file, which is dynamically created if it does not exist.

2. Libraries Used
   The following libraries are used in this project:
   express: For building the API.
   cluster: For utilizing multiple CPU cores.
   fs: For file system operations, including appending logs.
   path: For handling and resolving file paths.
   rate-limiter-flexible: For implementing user-based rate limiting.
   dotenv: For loading environment variables from a .env file.
   nodemon: For automatically restarting the server when changes are detected.

3. Environment Setup
   Make sure to create a .env file in the project root with the following variables:
   makefile
   PORT=4000
   LOG_FILE_PATH=logs.txt
   PORT: Specifies the port on which the server will run (default is 4000).
   LOG_FILE_PATH: Specifies the location of the log file, which is automatically created by the API.

4. Installation Requirements
   Install the required dependencies:
   Copy code
   npm install express rate-limiter-flexible dotenv
   Install nodemon globally (if not installed):
   Copy code
   npm install -g nodemon
5. How to Run the Project
   Run the server using nodemon:
   nodemon server.js
   The server will listen on the port defined in your .env file (4000 by default).
   The API is available at:
   POST /api/v1/task

6. API Workflow
   Task Submission: Users submit tasks via the /api/v1/task endpoint.
   Rate Limiting: Each user can submit only 1 task per second and 20 tasks per minute.
   Task Queueing: If a user exceeds the rate limit, the request is queued. Tasks in the queue are processed sequentially based on the rate limits.
   Logging: Task completion logs are appended to the file specified in the .env file.

7. How to Test Using Postman
   Start the server: Make sure the server is running by executing nodemon server.js.
   API Endpoint:
   URL: http://localhost:4000/api/v1/task
   Method: POST
   Body: Send the following JSON payload in the request body:
   {
   "user_id": "12345"
   }
   The user_id can be any string that uniquely identifies the user.
   Rate Limit Test:
   Submit tasks for the same user_id multiple times.
   The first 20 tasks will be processed immediately if sent within 60 seconds.
   Any further tasks will receive a 429 Too Many Requests status, and the following message:
   {
   "message": "Too many requests. Your task has been queued and will be processed shortly."
   }
   Log File:
   The API automatically appends a log entry in the log file (specified in .env) whenever a task is completed.
   Open the log file to view task completion logs.

8. Error Handling
   Missing user_id: If user_id is missing from the request body, the API responds with:
   {
   "message": "User ID is required."
   }
   Rate Limit Exceeded: If rate limits are exceeded, the API queues the task and returns a 429 status, indicating the task has been queued.

9. Conclusion
   This project demonstrates how to implement rate limiting and task queuing with a user-based approach using Node.js and express. By utilizing rate-limiter-flexible, we ensure that each user is restricted to a safe number of requests per second and minute. Any excess tasks are queued and handled as resources become available. The inclusion of clustering allows the application to take full advantage of multi-core systems, making it scalable and efficient.

The logs are automatically written to a file when tasks are processed, providing a simple way to track task completion. The project is designed to be easily tested using Postman, and the built-in rate-limiting ensures fair resource usage across multiple users.

This approach can be applied to similar scenarios where controlled task execution is necessary, ensuring that system resources are used effectively without overwhelming the server.
