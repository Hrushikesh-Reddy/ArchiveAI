import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from ..aws_s3 import generate_upload_url, get_file
from ..utils import auth0

router = APIRouter() 

router = APIRouter(dependencies=[
    Depends(auth0.require_auth(scopes=["read:messages", "write:messages"]))
])

@router.get("/upload/")
async def generate_url(user_id: str, filename: str):
    print(user_id, filename)
    res = generate_upload_url(user_id, filename)
    return res

@router.get("/image/")
async def get_image(Key: str):
    res = get_file(Key)
    image_bytes = res["Body"].read()
    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type="image/png"
    )