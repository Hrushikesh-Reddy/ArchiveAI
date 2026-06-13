import uuid6, uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, JSON, Column, UUID, func, DateTime
from sqlalchemy import ForeignKey

 

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[uuid.UUID] = Field(default=None, sa_column=Column(UUID, ForeignKey("session.id", ondelete="CASCADE")))
    input: Optional[dict[str, str]] = Field(sa_column=Column(JSON))
    response: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default=func.now()
    )
    
class Session(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid6.uuid7, primary_key=True)
    name: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default=func.now()
    )
    updated_at: datetime = Field(
        default_factory=datetime.now,
        sa_column=Column(DateTime(timezone=True)),
        #sa_column_kwargs={"onupdate":func.now()}
    )
    
class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    auth0_id: str = Field(unique=True)
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default=func.now()
    )

    
DatabaseModel = Message | Session | User