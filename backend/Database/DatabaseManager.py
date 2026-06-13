from sqlmodel import create_engine, Session, SQLModel, select, and_
from ..datamodel.db import DatabaseModel
from ..datamodel import Response
from loguru import logger
from sqlalchemy import exc 


class DatabaseManager:
    
    def __init__(self, database_uri: str):
        self.engine = create_engine(
            database_uri,
            pool_size=20, # number of connections
            max_overflow=40, # additional number of connections when pool is busy 
            pool_timeout=30, # how long a request waits for a connection
            pool_recycle=1800, # refresh connections every 30 minutes
            #echo=False,  # Disable SQL logging for performance
        )
        SQLModel.metadata.create_all(self.engine)
    
    def upsert(
        self,
        model: DatabaseModel,
        return_json: bool = False
    ) -> Response :
        
        status = True
        model_class = type(model)
        existing_model = None
        
        with Session(self.engine) as session:
            try:
                existing_model = session.exec(
                    select(model_class).where(model_class.id == model.id)
                ).first()
                #print(existing_model)
                #print(model.model_dump())
                if existing_model:
                    for key, value in model.model_dump().items():
                        setattr(existing_model, key, value)
                    model = existing_model
                    session.add(model)
                else:
                    session.add(model)
                session.commit()
                session.refresh(model)
            except Exception as e:
                session.rollback()
                logger.error(f"Error while updating/inserting : {str(model_class.__name__)}  {str(e)} ")
                status = False
        return Response(
            message=
                (f"{model_class.__name__} created successfully"
                if not existing_model
                else f"{model_class.__name__} updated successfully")
            ,
            status=status,
            data=model.model_dump() if return_json else model,
        ) 

        
    
    def get(
        self,
        model_class: type[DatabaseModel],
        columns: list[any] | None = None,
        filters: dict[str, any] | None = None,
        limit: int | None = None,
        return_json: bool = False,
        order: str = "desc",
        no_order: bool | None = False
    ) -> Response:
        result=[]
        status = True
        with Session(self.engine) as session:
                try:
                    #print(select(model_class).where(model_class.session_id == filters.get("session_id")))
                    statement = None
                    if columns:
                        statement = select(*columns)
                    else:
                        statement = select(model_class)
                    if filters : 
                        print("filtering")
                        conditions = [
                            getattr(model_class, col) == value 
                            for col, value in filters.items() 
                        ]
                        #print(f"conditions : {conditions}")
                        statement = statement.where(and_(*conditions))
                
                    if not no_order and hasattr(model_class, "id"):
                        order_by_clause = getattr(model_class.id, order)()
                        statement = statement.order_by(order_by_clause)
                    if limit : 
                        statement = statement.limit(limit)
                        #print(f"limiting by {limit}")
                    #print(order, limit)

                    if(columns):
                        items = session.exec(statement).mappings().all()
                        print(items, type(items), type(items[0]))
                        print(f"items : {items} {type(items)}\n")
                        result = [dict(r) for r in items]
                    else:
                        items = session.exec(statement).all()
                        result = [
                        item.model_dump() if return_json else item
                        for item in items
                    ]
                    status_message=f"{model_class.__name__} retrieved successfully"
                except Exception as e:
                    logger.error(f"Error getting from db : {e} {e.__cause__} {str(e)}")
                    status=False
                    status_message=f"Error while fetching {model_class.__name__}"
        
        return Response(
            message=status_message,
            status=status,
            data=result,
        )     
    
    def delete(self, model_class: type[DatabaseModel], filters: dict[str, any] | None = None) -> Response:
        status_message=""
        status=True
        with Session(self.engine) as session:
            try:
                statement = select(model_class)
                if filters:
                    conditions = [
                        getattr(model_class, col) == value
                        for col, value in filters.items()
                    ]
                    statement = statement.where(and_(*conditions))
                rows = session.exec(statement).all()
                
                if rows:
                    for row in rows:
                        session.delete(row)
                    session.commit()
                    status_message = f"{model_class.__name__} deleted successfully"
                else:
                    status_message = f"{model_class.__name__} row(s) not found"
                    logger.info(f"Rows with {filters} not found")
                    
            except exc.IntegrityError as e:
                session.rollback()
                status=False
                status_message=f"Integrity error : {model_class.__name__} is linked to another entity and cannot be deleted. {e}"
                logger.error(status_message)
            except Exception as e:
                session.rollback()
                status=False
                status_message=f"Error while deleting {model_class.__name__} : {e}"
                logger.error(status_message)
                
        return Response(message=status_message, status=status, data=None)
                
    
    def close(self):
        logger.info("Closing database connections...")
        try:
            self.engine.dispose()
            logger.info("Database connections closed successfully")
        except Exception as e:
            logger.error(f"Error closing database connections : {e}")
            raise # ?