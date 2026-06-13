import { mutationOptions, QueryClient } from '@tanstack/react-query'
import  getAccessToken  from "@/app/api/getAccessToken"

const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:8000';

export const mutateSessionOptions = (user_id: string|null, queryClient:QueryClient) => mutationOptions({
  mutationKey: ['create_session', user_id],
  mutationFn: async () => {
    
    if(!user_id){
      console.log("User_id is null, unable to create session")
      return [];
    }

    const token = await getAccessToken();
    const response = await fetch(`${base_url}/sessions/create/${user_id}`,{
        method:"POST",
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