from .connection import WebSocketManager
from .Database.DatabaseManager import DatabaseManager


websocket_manager: WebSocketManager = None
db_manager: DatabaseManager = None

async def init_managers(
        database_uri: str, 
    ) -> None:
    global websocket_manager, db_manager
    
    try:
        db_manager = DatabaseManager(database_uri)
        websocket_manager = WebSocketManager(db_manager)
    except Exception as e:
        print(f"Error initializing managers : {e}")
        await cleanup_managers()
        raise # ?

def get_websocket_manager():
    if not websocket_manager:
        print("Websocket manager not initialized")
        return
    return websocket_manager

def get_db():
    if not db_manager:
        print("database manager not initialized")
        return
    return db_manager

async def cleanup_managers():
    pass