import tempfile, os
from .aws_s3 import get_file
from ollama import AsyncClient
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct, models, FieldCondition, MatchValue
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer, CrossEncoder
from langchain_opendataloader_pdf import OpenDataLoaderPDFLoader
from loguru import logger
from huggingface_hub import login

class RAGPipeline:
    
    def __init__(self, qdrant_api_key: str, qdrant_api_url: str, ollama_api_key: str, hf_token: str):
        login(token=hf_token)
        self.model = SentenceTransformer(
            "sentence-transformers/msmarco-MiniLM-L12-v3", 
            device="cpu",
        )
        self.reranker = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L12-v2", 
            device="cpu",
        )
        self.client = AsyncQdrantClient(
            api_key=qdrant_api_key,
            url=qdrant_api_url,
            cloud_inference=True
        )
        self.ollamaClient = AsyncClient(
            host="https://ollama.com",
            headers={"Authorization" : f"Bearer {ollama_api_key}"}
        )
        
    def process_documents(self, url):
        """
        inputs :
            url -> document url S3
       """
        filename = url.split("/")[-1].split("_")[0]
        extention = url.split("/")[-1].split(".")[-1]
        logger.info(f" see : {filename, extention, url}")
        with tempfile.NamedTemporaryFile(delete=False, suffix="."+extention) as tmp_file:
            tmp_file_path = tmp_file.name
            tmp_file.close()
        get_file(key=url, path=tmp_file_path)
            
        loader = OpenDataLoaderPDFLoader(
            file_path=[tmp_file_path],
            format="text",
            #split_pages=False
        )
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = f"{filename}.{extention}"
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30, length_function=len)
        splits = text_splitter.split_documents(docs)
        splits = self.claculateChunkIds(splits)
        os.remove(tmp_file_path)
        logger.info(f"Processed {filename}.{extention}")
        return splits
    
    def claculateChunkIds(self, chunks):
        last_page_id=None
        current_chunk_index=1
        
        for chunk in chunks:
            
            current_page_id=f"{chunk.metadata.get("source")}:{chunk.metadata.get("page")}"
            
            if current_page_id == last_page_id:
                current_chunk_index+=1
            else:
                current_chunk_index=0
            
            current_chunk_id=f"{current_page_id}:{current_chunk_index}"
            chunk.metadata["id"]=current_chunk_id
            last_page_id=current_page_id
        
        return chunks

    def embed_documents(self, splits=None, query = None):
        """
        inputs :
            splits -> document splits
            query -> user query
        
        """
        if(query != None):
            logger.info(f"embedded query")
            return self.model.encode(query)
        
        if(splits == None):
            return
        
        chunks = [split.page_content for split in splits]
        vectors = self.model.encode(chunks)
        logger.info(f"Completed embedding {splits[0].metadata["source"]}")
        return [splits, vectors]
    
    async def store(self, vectors, url, user_id):
        """
        inputs :
            vectors -> embedded document chunks
            url -> file url
            user_id
        """
        
        points = []
        for i, (split, vector) in enumerate(zip(vectors[0], vectors[1])):
            points.append(
                PointStruct(
                    id=i,
                    vector=vector,
                    payload={
                        "text":split.page_content,
                        "chunk_id":split.metadata.get("id"),
                        "user-id":user_id,
                        "url":url
                    }
                )
            )
        res = await self.client.upsert(
            collection_name="Documents",
            points=points,
        )
        logger.info(f"Stored {vectors[0][0].metadata.get("source")} in qdrant")
    
    async def search(self, user_id, query):
        """
        inputs:
            user_id
            query
        """
        results = await self.client.query_points(
            collection_name="Documents",
            query=self.embed_documents(query=query),
            with_payload=True,
            limit=20,
            query_filter=models.Filter(
                must=[
                    FieldCondition(key="user-id", match=MatchValue(value=user_id)),
                ]
            )
        )
        
        chunks = [f"{result.payload.get("text")} [{result.payload.get("chunk_id")}]\n" for result in results.points]
        chunks = list(set(chunks))
        pairs = [(query, chunk) for chunk in chunks]
        scores = self.reranker.predict(pairs)
        ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)
        top_chunks = [chunk for chunk, _ in ranked[:10]]
        logger.info(f"search successful for query : {query}")
        return "".join(top_chunks)
    
    async def generate(self, query, user_id):
        try:
            context = await self.search(user_id, query)
        
            prompt=f"""
            Answer the query based on the following context, give citations when available:
            {context}
            ---
            query : {query}"""
            
            message = [{
            "role":"user",
            "content":prompt
        }]
        
            response = await self.ollamaClient.chat(
            model="gemma4:31b-cloud",
            messages=message, 
            stream=True)
            logger.info("returned generator")
            return response
        except Exception as e :
            logger.error(f"Error while generating : {e}")
            
    async def clearDb(self, user_id):
        res = await self.client.create_payload_index(
            collection_name="Documents",
            field_name="user-id",
            field_schema=models.PayloadSchemaType.INTEGER, # Match your ID type (Integer or Keyword)
        )
        res = await self.client.delete(
            collection_name="Documents",
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="user-id",
                            match=models.MatchValue(value=user_id)
                        )
                    ]
                )
            )
        )
        logger.info(f"Cleared all documents of user : {user_id} from qdrant")

    async def generate_session_name(self, prompt: str):
        messages = [
                {"role": "system", "content": "Generate a short session name within 50 characters, don't give any explanation"},
                {"role": "user", "content": f"{prompt}"}
            ]
        
        response = await self.ollamaClient.chat(
            model="glm-4.6:cloud",
            messages=messages
        )
        return response.message.content 