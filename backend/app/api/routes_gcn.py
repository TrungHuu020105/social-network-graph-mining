"""
Routes for GCN training and prediction.
"""

from fastapi import APIRouter, HTTPException

from app.services.gcn_service import get_gcn_service

router = APIRouter(prefix="/api/gcn", tags=["gcn"])


@router.get("/train")
async def train_gcn():
    try:
        service = get_gcn_service()
        result = service.train()
        return {
            "accuracy": round(result.accuracy, 4),
            "loss": round(result.loss, 6),
            "train_size": result.train_size,
            "test_size": result.test_size,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/predict/{node_id}")
async def predict_node(node_id: str):
    try:
        service = get_gcn_service()
        result = service.get_prediction(node_id)
        return {
            "node_id": result["node_id"],
            "predicted_label": result["predicted_label"],
            "probability": round(result["probability"], 6),
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/all-predictions")
async def get_all_predictions():
    try:
        service = get_gcn_service()
        predictions = service.get_all_predictions()
        return {"predictions": predictions, "count": len(predictions)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/embeddings")
async def get_embeddings():
    try:
        service = get_gcn_service()
        embeddings = service.get_embeddings()
        return {"embeddings": embeddings, "count": len(embeddings)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
