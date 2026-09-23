import uvicorn
from runtime.config.settings import RUNTIME_HOST, RUNTIME_PORT

if __name__ == "__main__":
    uvicorn.run(
        "runtime.api.server:app",
        host=RUNTIME_HOST,
        port=RUNTIME_PORT,
        workers=1,
    )
