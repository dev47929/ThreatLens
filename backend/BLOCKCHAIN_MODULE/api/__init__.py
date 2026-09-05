from fastapi import APIRouter


from .internal_chain_route import router as internal_chain_router
from .eth_route import router as eth_router

chain_router = APIRouter()
chain_router.include_router(internal_chain_router)
chain_router.include_router(eth_router)
