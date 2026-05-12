# ToDo App (Node.js + MySQL + AL2023)

This project is a modern, lightweight, and high-performance ToDo application designed to run on AWS EC2 (Amazon Linux 2023) and integrate with AWS RDS (MySQL).

## Features

- **Modern Interface:** Clean and responsive (mobile-friendly) HTML/CSS frontend.
- **Automatic Table Setup:** The application automatically creates the required `todos` table on the first run.
- **Health Check Endpoint:** Includes a `/health` endpoint for AWS Application Load Balancer (ALB) integration.
- **Systemd Integration:** Ready-to-use configuration for running the app in the background continuously and auto-restarting upon crashes on EC2.
- **Connection Pool:** Stable and performant connection to the RDS database.

## Local Setup and Running

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Rename the `.env.example` file to `.env` and enter your RDS/MySQL credentials:
   ```env
   PORT=8080
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=tododb
   DB_PORT=3306
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Installation on AWS EC2 (Amazon Linux 2023)

When launching an EC2 Instance, you can automate the entire setup process (installing Node.js, Git, pulling the application, and configuring the Systemd service) by pasting the script inside the `user_data_AL2023.sh` file into the "User Data" section. Don't forget to customize the `git clone` and `.env` parts in the script according to your environment.

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL (mysql2/promise)
- **Frontend:** HTML, Vanilla CSS, Vanilla JavaScript
