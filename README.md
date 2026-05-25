# ToDo App (Node.js + MySQL + AL2023) - Separated Frontend & Backend

This project is a modern, lightweight, and high-performance ToDo application designed to run on AWS EC2 (Amazon Linux 2023) and integrate with AWS RDS (MySQL). The project has been separated into frontend and backend directories for independent deployment.

## Project Structure

- **`backend/`**: Contains the Node.js API server.
- **`frontend/`**: Contains the static HTML/CSS/JS frontend.

## Features

- **Modern Interface:** Clean and responsive (mobile-friendly) HTML/CSS frontend.
- **API-Driven:** Frontend communicates with the backend via REST API.
- **Automatic Table Setup:** The backend automatically creates the required `todos` table on the first run.
- **Health Check Endpoint:** Includes a `/health` endpoint for AWS Application Load Balancer (ALB) integration.
- **Connection Pool:** Stable and performant connection to the RDS database.

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy from `.env.example`) and enter your RDS/MySQL credentials.
4. Start the backend:
   ```bash
   npm start
   ```

## Frontend Setup

1. Open `frontend/index.html`.
2. Update the `BACKEND_URL` constant with your backend server's IP address or domain.
   ```javascript
   const BACKEND_URL = 'http://your-backend-ip'; 
   ```
3. Serve the `frontend/` directory using any web server (Nginx, Apache, or S3 bucket hosting).

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL (mysql2/promise)
- **Frontend:** HTML, Vanilla CSS, Vanilla JavaScript
