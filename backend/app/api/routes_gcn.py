"""
Routes for GCN training and prediction.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/gcn", tags=["gcn"])


@router.get("/train")
async def train_gcn():
    try:
        from app.services.gcn_service import get_gcn_service

        service = get_gcn_service()
        result = service.train()
        return {
            "accuracy": round(result.accuracy, 4),
            "loss": round(result.loss, 6),
            "train_size": result.train_size,
            "test_size": result.test_size,
            "class_metrics": [
                {
                    "label": item["label"],
                    "precision": round(float(item["precision"]), 4),
                    "recall": round(float(item["recall"]), 4),
                    "f1_score": round(float(item["f1_score"]), 4),
                    "support": int(item["support"]),
                }
                for item in result.class_metrics
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/predict/{node_id}")
async def predict_node(node_id: str):
    try:
        from app.services.gcn_service import get_gcn_service

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
        from app.services.gcn_service import get_gcn_service

        service = get_gcn_service()
        predictions = service.get_all_predictions()
        return {"predictions": predictions, "count": len(predictions)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/embeddings")
async def get_embeddings():
    try:
        from app.services.gcn_service import get_gcn_service

        service = get_gcn_service()
        embeddings = service.get_embeddings()
        return {"embeddings": embeddings, "count": len(embeddings)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/link/train")
async def train_gcn_link_predictor():
    try:
        from app.services.gcn_link_service import get_gcn_link_service

        service = get_gcn_link_service()
        result = service.train()
        return {
            "auc": round(result.auc, 4),
            "loss": round(result.loss, 6),
            "train_edges": result.train_edges,
            "val_edges": result.val_edges,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/link/score/{source_id}/{target_id}")
async def score_link_pair(source_id: str, target_id: str):
    try:
        from app.services.gcn_link_service import get_gcn_link_service

        service = get_gcn_link_service()
        score = service.score_pair(source_id, target_id)
        return {
            "source_id": source_id,
            "target_id": target_id,
            "score": round(float(score), 6),
            "model": "gcn_link_predictor",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
