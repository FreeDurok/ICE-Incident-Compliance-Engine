from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.taxonomy_service import taxonomy_service

router = APIRouter()


@router.get("/")
async def get_taxonomy():
    """Ritorna l'intera tassonomia ACN"""
    return taxonomy_service.get_taxonomy()


@router.get("/macrocategories")
async def get_macrocategories():
    """Ritorna tutte le macrocategorie"""
    return taxonomy_service.get_macrocategories()


@router.get("/macrocategories/{code}")
async def get_macrocategory(code: str):
    """Ritorna una specifica macrocategoria"""
    mc = taxonomy_service.get_macrocategory(code)
    if not mc:
        raise HTTPException(status_code=404, detail=f"Macrocategoria {code} non trovata")
    return mc


@router.get("/macrocategories/{mc_code}/predicates/{pred_code}")
async def get_predicate(mc_code: str, pred_code: str):
    """Ritorna un predicato specifico"""
    pred = taxonomy_service.get_predicate(mc_code, pred_code)
    if not pred:
        raise HTTPException(
            status_code=404,
            detail=f"Predicato {pred_code} non trovato in {mc_code}"
        )
    return pred


@router.get("/wizard")
async def get_wizard_structure():
    """Ritorna la struttura per il wizard"""
    return taxonomy_service.get_wizard_structure()


@router.get("/validate/{code}")
async def validate_code(code: str):
    """Valida un codice della tassonomia"""
    is_valid = taxonomy_service.validate_code(code)
    return {"code": code, "valid": is_valid}
