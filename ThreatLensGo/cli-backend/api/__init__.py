# app/api/__init__.py

from fastapi import APIRouter

from .auth_route import router as auth_router
from .chat_route import router as chat_router
from .git_route import router as git_router
from .ddos_route import router as ddos_router
from .system_route import router as system_router
from .sqli_route import router as sqli_router
from .xss_route import router as xss_router
from .proxy_route import router as proxy_router
from .data_burning_route import router as data_burning_router
from .llm_gateway_route import router as llm_gateway_router

api_router = APIRouter()

# Include routers
api_router.include_router(system_router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(git_router)
api_router.include_router(ddos_router)
api_router.include_router(data_burning_router)
api_router.include_router(sqli_router)
api_router.include_router(xss_router)
api_router.include_router(proxy_router)
api_router.include_router(llm_gateway_router)