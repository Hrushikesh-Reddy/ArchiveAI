from pydantic import BaseModel
from typing import Optional, Any


class Input(BaseModel):
    prompt:str
    file:str | None 
    
class Run(BaseModel):
    user_id:str
    input:Input
    
class Response(BaseModel):
    message: str 
    status: bool
    data: Optional[Any] = None


    