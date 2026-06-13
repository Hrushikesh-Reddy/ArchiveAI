import { queryOptions } from '@tanstack/react-query'
import  getAccessToken  from "@/app/api/getAccessToken"

const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:8000';

export const messageOptions = (session_id: string|null|undefined) => queryOptions({
  queryKey: ['message', session_id],
  queryFn: async () => {
    
    const token = await getAccessToken()
    //console.log("tokenres auth0", token)
    const response = await fetch(`${base_url}/sessions/${session_id}/messages` ,
    {
        headers:{
        "Authorization" : `Bearer ${token}`
      }
    } 
    )

    return response.json()
    
  },
})