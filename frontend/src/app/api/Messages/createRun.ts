import { mutationOptions } from '@tanstack/react-query'
import { Input } from "@/app/types/datamodel"
import  getAccessToken  from "@/app/api/getAccessToken"

const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:8000';

export const createRunOptions = mutationOptions({
  mutationKey: ['create_run'],
  mutationFn: async ({user_id, session_id, input}:{user_id: string|null, session_id: string|undefined, input: Input}) => {

    const token = await getAccessToken();
    //console.log(user_id, session_id, input)
    let upload_data = null;
    if(input.file){
        let res = await fetch(`${base_url}/upload/?user_id=${user_id}&filename=${input.file.name}`, {
            headers:{
                "Authorization" : `Bearer ${token}`
            }
        })
        upload_data = await res.json()
        let ureq = await fetch(upload_data.url, {
                method: "PUT",
                body: input.file,
                headers: { "content-type": input.file.type }
            })
        console.log(ureq)
    }

        const req = new Request(`${base_url}/sessions/run`, {
            method: "POST",
            headers: {
                "content-type": "Application/Json",
                "Authorization" : `Bearer ${token}`
            },
            body: JSON.stringify({
            "user_id": user_id,
            "session_id": session_id,
            input: {
                prompt: input.prompt,
                file: upload_data ? upload_data.Key : null
            }
        }),
        })
        let response = await fetch(req)
        return response.json();
  },
  onSuccess: ()=>{
  }
})