from .RAG import RAGPipeline

rag_pipeline: RAGPipeline = None 

def initialize_rag_pipeline(
            qdrant_api_key, 
            qdrant_api_url, 
            ollama_api_key,
            hf_token,
):
    global rag_pipeline
    try:
        rag_pipeline = RAGPipeline(
            qdrant_api_key, 
            qdrant_api_url, 
            ollama_api_key,
            hf_token,
        )
    except Exception as e:
        print(f"Error initializing rag pipeline : {e}")
        raise # ?
    
def get_rag_pipeline():
    if not rag_pipeline:
        print("rag_pipeline not initialized")
        return
    return rag_pipeline

