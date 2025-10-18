#!/bin/bash

# Run the PostgreSQL container using Docker
docker run \
    --name pg-container \
    -e POSTGRES_USER=admin \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=vididpro \
    -e POSTGRES_PORT=5432 \
    -p 5432:5432 \
    -d postgres
    
