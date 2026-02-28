from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.database import get_supabase
from app.schemas import schemas
from app.crud import crud

router = APIRouter(prefix="/api/v1/branding", tags=["branding"])

OWNER_ID = 1  # Hardcoded for MVP (no auth yet)


@router.get("", response_model=schemas.BrandingWithLabels)
def get_branding(sb: Client = Depends(get_supabase)):
    """Fetch branding settings + all custom labels for the current user."""
    result = crud.get_branding_with_labels(sb, OWNER_ID)
    if not result or not result.get("id"):
        # Return defaults if no branding record exists yet
        defaults = schemas.BrandingSettingsBase()
        return {**defaults.model_dump(), "id": "", "owner_id": OWNER_ID,
                "created_at": None, "updated_at": None, "labels": {}}
    return result


@router.put("", response_model=schemas.BrandingWithLabels)
def update_branding(branding: schemas.BrandingSettingsUpdate, sb: Client = Depends(get_supabase)):
    """Update branding settings (upsert)."""
    updated = crud.upsert_branding(sb, branding, OWNER_ID)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to save branding settings")
    labels = crud.get_labels(sb, OWNER_ID)
    updated["labels"] = labels
    return updated


@router.put("/labels", response_model=dict)
def update_labels_batch(labels: dict[str, str], sb: Client = Depends(get_supabase)):
    """Batch update custom labels. Send a dict of {label_key: label_value}."""
    result = crud.upsert_labels_batch(sb, labels, OWNER_ID)
    return result


@router.put("/labels/{label_key}", response_model=dict)
def update_label(label_key: str, body: schemas.CustomLabelUpdate, sb: Client = Depends(get_supabase)):
    """Update a single custom label."""
    result = crud.upsert_label(sb, label_key, body.label_value, OWNER_ID)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to save label")
    return {"label_key": label_key, "label_value": body.label_value}


@router.delete("/labels/{label_key}")
def delete_label(label_key: str, sb: Client = Depends(get_supabase)):
    """Reset a label to its default by deleting the custom value."""
    crud.delete_label(sb, label_key, OWNER_ID)
    return {"deleted": label_key}
