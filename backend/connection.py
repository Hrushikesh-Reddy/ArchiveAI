import uuid, asyncio
from typing import Dict
from fastapi import WebSocket, WebSocketDisconnect
from .datamodel.db import Message
from loguru import logger
from starlette.websockets import WebSocketState
from .RAG import RAGPipeline
 
class WebSocketManager:
    
    def __init__(self, db_manager):
        self._connections: Dict[str, WebSocket] = {}
        self._tasks: Dict[str, asyncio.Task] = {}
        self.db_manager = db_manager

    async def connect(self, session_id:str, websocket: WebSocket) -> bool:
        try :
            await websocket.accept()
            self._connections[session_id] = websocket
            return True
        except Exception as e:
            logger.error(f"Connection error for session {session_id} : {e}")
            return False

    async def disconnect(self, session_id:str) -> None:
        logger.info(f"Disconnecting session {session_id}")
        self._connections.pop(session_id, None)
        
        if session_id in self._tasks and not self._tasks[session_id].done() :
            await self.stop_stream(session_id)
        self._tasks.pop(session_id, None)
        
        logger.info(f"connection closed for session : {session_id}")
    
    async def _send_message(self, session_id:str, message: str) -> None:
        
        if session_id not in self._connections:
            logger.info("Attempted to send message to a closed connection for session {session_id}")
            return
        
        try:    
            ws = self._connections[session_id]
            if ws.client_state == WebSocketState.CONNECTED :
                await ws.send_json(message)
            else : 
                logger.warning(f"Websocket is not connected for session : {session_id}")
                return
            
        except WebSocketDisconnect:
            logger.error("Websocket disconnected while sending message for session {session_id}")
            await self.disconnect(session_id)
        except Exception as e:
            logger.error(f"Error sending message for session {session_id} {e} {message}")
            await self.disconnect(session_id)
    
    async def _save_message(self, session_id:str, message:str, status:str):
        try:
            msg = self.get_run(session_id)
            #print("run : ", run)
            msg.response = message
            msg.status = status
            #logger.info(f"saving message : {msg}")
            res = self.db_manager.upsert(msg)
           # logger.info(f"\n{res}\n")
        except Exception as e:
            logger.error(f"Error saving message : {e}")
    
    def get_run(self, session_id: str) -> Message:
        try :
            res = self.db_manager.get(Message, limit=1, filters={"session_id": uuid.UUID(session_id)})
            print(res)
            return res.data[0]
        except Exception as e:
            logger.error(f"Error getting run : {e}")    
                
    def add_task(self, session_id:str, task:asyncio.Task) -> None:
        self._tasks[session_id] = task
    
    async def start_stream(self, session_id:str, user_id:str, prompt:str, rag_pipe: RAGPipeline) -> None:
        logger.info("entered start stream")
        if session_id not in self._connections:
            raise ValueError("No active connection for session {session_id}") 
        
        try:
            logger.info("call rag_pipe.generate")
            stream = await rag_pipe.generate(user_id=user_id, query=prompt)
            result=[]
            logger.info("called rag_pipe.generate")
            async for chunk in stream:
                message = {
                    "type":"message",
                    "status": "COMPLETED" if chunk.done else "INPROGRESS",
                    "content" : chunk['message']['content'],
                }
                result.append(message["content"])
                await self._send_message(session_id, message)
            await self._save_message(session_id, "".join(result), "COMPLETED")
            
        except asyncio.CancelledError:
            logger.warning(f"run interrupted by user or server cleanup")
            await asyncio.shield(self._save_message(session_id, "".join(result), "STOPPED"))
            raise # ?
        except Exception as e:
            await self._send_message(session_id, {"type" : "Error", "reason" : f"{e}"})
            await asyncio.shield(self._save_message(session_id, "".join(result), "ERROR"))
            logger.error(f"Error streaming for session {session_id}: {e}")
        finally:
            self._tasks.pop(session_id, None)
    
    async def stop_stream(self, session_id) -> None:
        if session_id not in self._tasks:
            logger.info(f"Unable to stop stream, No active runs in session {session_id}")
            return
        
        try:
            task = self._tasks[session_id]
            task.cancel()
            message = {
                "type":"stopped",
                "reason" : "Interrupted by user"
            }
            await self._send_message(session_id, message)
        except Exception as e:
            logger.error(f"Error cancelling run for session : {session_id} -> {e}")
        finally:
            logger.info(f"stopped run for session {session_id}")
            self._tasks.pop(session_id, None)
            
    async def cleanup(self):
        logger.info(f"Cleaning up {len(self._connections)} active connections")
        
        try:
            for session_id in self._connections.copy():
                self._tasks[session_id].cancel()
                message = {
                "type":"stopped",
                "reason" : "Server cleanup"
                }
                await self._send_message(session_id, message)
            
            async def disconnect_all():
                for session_id in self._connections.copy():
                    try:
                        asyncio.wait_for(self.disconnect(session_id), timeout=2)
                    except asyncio.TimeoutError:
                        logger.error(f"Timeout while disconnecting session : {session_id}")
                    except Exception as e:
                        logger.error(f"Unable to disconnect session {session_id} : {e}")
            
            await asyncio.wait_for(disconnect_all(), timeout=10)
            
        except asyncio.TimeoutError:
            logger.error(f"WebsocketManager cleanup timed out")
        except Exception as e:
            logger.error(f"Error while WebscoketManager cleanup : {e}")
        finally:
            self._connections.clear()
            self._tasks.clear()
                
                
        
    
    
            



