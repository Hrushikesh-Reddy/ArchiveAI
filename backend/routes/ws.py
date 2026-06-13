import asyncio
from ..datamodel.types import Run
from ..connection import WebSocketManager
from ..dependencies import get_websocket_manager
from fastapi import Depends, APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger
from ..pipeline import get_rag_pipeline
from ..RAG import RAGPipeline

router = APIRouter() 

@router.websocket("/runs/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    websocket_manager:WebSocketManager = Depends(get_websocket_manager),
    rag_pipe:RAGPipeline = Depends(get_rag_pipeline),
):
    connected = await websocket_manager.connect(session_id, websocket)
    if not connected:
        await websocket.close(code=4002, reason="Failed to establish connection")
        logger.error("Failed to establish connection")
        return
 
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "start":
                run = Run.model_validate(data.get("Run")).model_dump()
                files = run.get("input").get("file")
                if(files):
                    splits= await asyncio.to_thread(rag_pipe.process_documents, url=files)
                    vectors = await asyncio.to_thread(rag_pipe.embed_documents, splits=splits)
                    await rag_pipe.store(vectors=vectors, user_id=run.get("user_id"), url=files)
                task = asyncio.create_task(websocket_manager.start_stream(
                    session_id,
                    run.get("user_id"),
                    run.get("input").get("prompt"),
                    rag_pipe
                ))
                websocket_manager.add_task(session_id, task)
                logger.info(f"Started streaming response for prompt: {run.get("input").get("prompt")}")
                
            elif data.get("type") == "stop":
                await websocket_manager.stop_stream(session_id)
                
    except WebSocketDisconnect:
        logger.info(f"Websocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Websocket error: {e}")
    finally:
        await websocket_manager.disconnect(session_id)
        
        
        
