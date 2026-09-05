from fastapi import APIRouter


from .internal_chain_route import router as internal_chain_router

chain_router = APIRouter()
chain_router.include_router(internal_chain_router)
