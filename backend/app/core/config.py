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

# Twitch/PTBR dataset files (preferred for graph ML)
TWITCH_PT_EDGES_FILE = DATA_DIR / "twitch_pt_edges.csv"
TWITCH_PT_FEATURES_FILE = DATA_DIR / "twitch_pt_features.json"
TWITCH_PT_TARGET_FILE = DATA_DIR / "twitch_pt_target.csv"

# Backward-compatible PTBR names (currently available in repo)
PTBR_EDGES_FILE = DATA_DIR / "PTBR_edges.csv"
PTBR_FEATURES_FILE = DATA_DIR / "PTBR_features.json"
PTBR_TARGET_FILE = DATA_DIR / "PTBR_target.csv"
