# PulseGuard

AI-powered home cardiac monitoring system using PPG heart-rate sensing, GSR, a web dashboard, and an ONNX ML model.

## Features
- Real-time heart rate monitoring
- Stress estimation using GSR
- Dashboard with reports, login, settings
- ONNX model for inference

## Project Structure
- dashboard.html - Main dashboard
- reports.html - Health reports
- login.html/signup.html - Authentication UI
- settings.html - Configuration
- GSR.ino.ino - Arduino firmware
- Heart_Rate_.ipynb - ML workflow
- heartrate.onnx - Exported model

## Setup
Open HTML files in a browser. Upload Arduino sketch to compatible board. Use the notebook to retrain the model.

## Architecture
Sensors -> Arduino -> Data Processing -> ONNX Model -> Dashboard.

## Future Work
Bluetooth, cloud sync, alerts, clinician portal.
