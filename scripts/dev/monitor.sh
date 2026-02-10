#!/bin/bash

# Basic Monitoring Script for Historian App
# This script checks the health of all services

LOG_FILE="/var/log/historian-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "$DATE - Starting health check..." >> $LOG_FILE

# Check if containers are running
if ! docker ps | grep -q "historian-nginx"; then
    echo "$DATE - ERROR: nginx container is not running" >> $LOG_FILE
    # You could add notification here (email, Slack, etc.)
fi

if ! docker ps | grep -q "historian-app"; then
    echo "$DATE - ERROR: app container is not running" >> $LOG_FILE
fi

if ! docker ps | grep -q "historian-redis"; then
    echo "$DATE - ERROR: redis container is not running" >> $LOG_FILE
fi

# Check if services are responding
if ! curl -f -s https://evidoxa.com > /dev/null; then
    echo "$DATE - ERROR: evidoxa.com is not responding" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

echo "$DATE - Health check completed" >> $LOG_FILE 