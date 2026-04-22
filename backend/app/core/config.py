import os
from pathlib import Path

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Data directory
DATA_DIR = BASE_DIR / "data"

# API Configuration
API_PREFIX = "/api"
API_TITLE = "SocialGraph Analytics API"
API_VERSION = "1.0.0"

# CORS Configuration
CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]

# Sample data files
SAMPLE_NODES_FILE = DATA_DIR / "sample_nodes.csv"
SAMPLE_EDGES_FILE = DATA_DIR / "sample_edges.csv"
