from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests , httpx
from fastapi.responses import RedirectResponse
from api import api_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


# response = httpx.get(
#     "https://api.threadlens.dev/auth/status",
#     headers={
#         "Authorization": f"Bearer {token}"
#     }
# )

# data = response.json()

# print(data)





def run():
    import uvicorn

    uvicorn.run(
        "connect:app",
        host="0.0.0.0",
        port=1234,
        reload=True,
    )



if __name__ == "__main__":
    run()