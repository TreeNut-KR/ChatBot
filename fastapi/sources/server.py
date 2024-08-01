from fastapi import FastAPI
import uvicorn

import utils.chat_mongo as cm

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
