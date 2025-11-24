#!/bin/bash
set -a
source .env.local
set +a
.venv/bin/python -m uvicorn api.index:app --reload --port 8000
