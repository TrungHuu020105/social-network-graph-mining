"""
FastAPI main application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import (
    API_PREFIX, API_TITLE, API_VERSION,
    CORS_ORIGINS, CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS
)
from app.api import (
    routes_overview,
    routes_graph,
    routes_community,
    routes_users,
    routes_recommendations,
    routes_comparison,
    routes_evaluation,
    routes_dataset,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="SocialGraph Analytics - Graph Mining for Community Detection and Link Prediction",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)

# Include routers
app.include_router(routes_overview.router)
app.include_router(routes_graph.router)
app.include_router(routes_community.router)
app.include_router(routes_users.router)
app.include_router(routes_recommendations.router)
app.include_router(routes_comparison.router)
app.include_router(routes_evaluation.router)
app.include_router(routes_dataset.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SocialGraph Analytics API",
        "version": API_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
