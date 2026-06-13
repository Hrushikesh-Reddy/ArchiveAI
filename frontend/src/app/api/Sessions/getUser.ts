import { queryOptions } from '@tanstack/react-query'
import  getAccessToken  from "@/app/api/getAccessToken"

const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:8000';

export const userOptions = () => queryOptions({
  queryKey: ['user', ],
  queryFn: async () => {
    const token = await getAccessToken();
    const response = await fetch(`${base_url}/auth/user`,
      {
        headers:{
        "Authorization" : `Bearer ${token}`
      } ,
      method:"POST"
    }
    )
    return response.json()
  },
})