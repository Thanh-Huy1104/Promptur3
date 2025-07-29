#!/bin/bash

# Docker management script for Prompture

case "$1" in
  "start")
    echo "Starting Prompture services..."
    docker-compose up -d
    ;;
  "stop")
    echo "Stopping Prompture services..."
    docker-compose down
    ;;
  "restart")
    echo "Restarting Prompture services..."
    docker-compose restart
    ;;
  "logs")
    echo "Showing logs for all services..."
    docker-compose logs -f
    ;;
  "db-only")
    echo "Starting only database services..."
    docker-compose up -d db redis
    ;;
  "build")
    echo "Building and starting all services..."
    docker-compose up -d --build
    ;;
  "clean")
    echo "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|db-only|build|clean}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show logs for all services"
    echo "  db-only  - Start only database services"
    echo "  build    - Build and start all services"
    echo "  clean    - Stop services and clean up volumes"
    exit 1
    ;;
esac
