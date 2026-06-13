import { queryOptions } from '@tanstack/react-query'
import  getAccessToken  from "@/app/api/getAccessToken"

const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:8000';

export const sessionOptions = (user_id: string|null) => queryOptions({
  queryKey: ['session', user_id],
  queryFn: async () => {
    if(!user_id){
      console.log("user_id is null , unable to get session list");
      return [];
    }
    const token = await getAccessToken();
    const response = await fetch(`${base_url}/sessions/${user_id}`,
      {
        headers:{
        "Authorization" : `Bearer ${token}`
      } 
    }
    )

    return response.json()
  },
})