export async function get_upload_url(user_id: String | null, file:File){
    const base_url = process.env.NEXT_PUBLIC_APP_BASE_URL
    if(user_id){
    let res = await fetch(`${base_url}/upload/?user_id=${user_id}&filename=${file.name}`)
        const upload_data = await res.json()
        return upload_data}
}