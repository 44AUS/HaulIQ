from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.app_settings import AppInfo, TutorialCategory, FeatureRequest, ReportedProblem

router = APIRouter()


# ── App Info ──────────────────────────────────────────────────────────────────
@router.get("/app-info")
def get_app_info(db: Session = Depends(get_db)):
    info = db.query(AppInfo).filter(AppInfo.id == 1).first()
    if not info:
        return {
            "status": "normal",
            "current_version": "1.0.0",
            "latest_version": "1.0.0",
            "release_video_url": None,
            "whats_new": [],
            "known_issues": [],
        }
    return {
        "status": info.status,
        "current_version": info.current_version,
        "latest_version": info.latest_version,
        "release_video_url": info.release_video_url,
        "whats_new": info.whats_new or [],
        "known_issues": info.known_issues or [],
    }


# ── Tutorials ─────────────────────────────────────────────────────────────────
@router.get("/tutorials")
def get_tutorials(db: Session = Depends(get_db)):
    cats = db.query(TutorialCategory).order_by(TutorialCategory.order_idx).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "thumbnail_url": c.thumbnail_url,
            "description": c.description,
            "video_count": len(c.videos),
            "videos": [
                {
                    "id": str(v.id),
                    "title": v.title,
                    "youtube_url": v.youtube_url,
                    "description": v.description,
                    "duration": v.duration,
                }
                for v in c.videos
            ],
        }
        for c in cats
    ]


# ── Feature Request ───────────────────────────────────────────────────────────
class FeatureRequestIn(BaseModel):
    title: str
    description: Optional[str] = None


@router.post("/feature-request", status_code=201)
def submit_feature_request(
    body: FeatureRequestIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.add(FeatureRequest(user_id=user.id, title=body.title, description=body.description))
    db.commit()
    return {"ok": True}


# ── Report Problem ────────────────────────────────────────────────────────────
class ReportProblemIn(BaseModel):
    title: str
    description: Optional[str] = None
    severity: Optional[str] = "normal"


@router.post("/report-problem", status_code=201)
def report_problem(
    body: ReportProblemIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.add(ReportedProblem(
        user_id=user.id,
        title=body.title,
        description=body.description,
        severity=body.severity or "normal",
    ))
    db.commit()
    return {"ok": True}
