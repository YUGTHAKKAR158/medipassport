#!/bin/bash
echo "================================"
echo "  MediPassport Server Startup"
echo "================================"
read -p "Enter the EC2 public IP (or press Enter for localhost): " EC2_IP

if [ -z "$EC2_IP" ]; then
  APP_BASE_URL=""
  echo "Running in local mode"
else
  APP_BASE_URL="http://$EC2_IP:3000"
  echo "Setting base URL to: $APP_BASE_URL"
fi

export APP_BASE_URL=$APP_BASE_URL

# Write to .env file so docker-compose picks it up
sed -i "s|APP_BASE_URL=.*|APP_BASE_URL=$APP_BASE_URL|g" .env 2>/dev/null || echo "APP_BASE_URL=$APP_BASE_URL" >> .env

echo "Starting containers..."
docker-compose up --build -d

echo ""
echo "================================"
echo "  App is running!"
if [ -z "$EC2_IP" ]; then
  echo "  Frontend: http://localhost:3000"
else
  echo "  Frontend: http://$EC2_IP:3000"
fi
echo "================================"
