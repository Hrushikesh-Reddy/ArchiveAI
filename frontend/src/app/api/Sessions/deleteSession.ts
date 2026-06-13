import { mutationOptions, QueryClient } from '@tanstack/react-query'
import  getAccessToken  from "@/app/api/getAccessToken"

const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:8000';

export const deleteSessionOptions = (session_id: string|null, queryClient:QueryClient) => mutationOptions({
  mutationKey: ['session'],
  mutationFn: async () => {
    
    const token = await getAccessToken();
    console.log("Sending delete query for session : ", session_id)
    const response = await fetch(`${base_url}/sessions/delete/${session_id}`,{
        method:"DELETE",
        headers:{
        "Authorization" : `Bearer ${token}`
      }
    
    })

    return response.json()
  },
  onSuccess: ()=>{
    queryClient.invalidateQueries({queryKey:["session"]})
  }
})