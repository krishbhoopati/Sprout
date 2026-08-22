from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .errors import ApiError
from .routes import crops, gardens, marketplace, plans, weather, webhooks, world

app = FastAPI(title="Sprout API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {
        "status": "ok",
        "supabase_configured": settings.supabase_configured,
        "mock_weather": settings.mock_weather,
        "mock_world_labs": settings.mock_world_labs,
    }


app.include_router(crops.router)
app.include_router(gardens.router)
app.include_router(plans.router)
app.include_router(weather.router)
app.include_router(world.router)
app.include_router(marketplace.router)
app.include_router(webhooks.router)
