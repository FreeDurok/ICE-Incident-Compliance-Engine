from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class TaxonomyValue(BaseModel):
    code: str
    label: str
    description: str


class SubPredicate(BaseModel):
    code: str
    name: str
    description: str
    values: List[TaxonomyValue]


class Predicate(BaseModel):
    code: str
    name: str
    description: str
    has_subpredicates: bool
    subpredicates: List[SubPredicate] = []
    values: List[TaxonomyValue] = []


class MacroCategory(BaseModel):
    code: str
    name: str
    description: str
    predicates: List[Predicate]


class Taxonomy(BaseModel):
    name: str
    version: str
    source: Dict[str, str]
    macrocategories: List[MacroCategory]


class TaxonomyTree(BaseModel):
    """Struttura ad albero per il wizard"""
    macrocategory: str
    predicates: List[Dict[str, Any]]
