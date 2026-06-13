from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_uri: str
    qdrant_api_key: str
    qdrant_api_url: str
    ollama_api_key: str
    hf_token: str
    AWS_BUCKET_NAME: str
    AWS_BUCKET_REGION: str
    AWS_ACCESS_KEY: str
    AWS_SECRET_KEY: str 
    AUTH0_DOMAIN: str 
    AUTH0_AUDIENCE: str
    
    model_config=SettingsConfigDict(env_file=".env")

settings = Settings()