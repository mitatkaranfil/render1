#!/bin/bash

echo "=== Cosmofy Full Stack Application ==="
echo "Installing dependencies..."
npm run install-deps

echo "Building frontend..."
npm run build

echo "Starting server..."
npm start 