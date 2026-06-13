interface TokenData {
  token: string;      // The raw JWT string
  scope: string;      // Space-separated list of scopes
  expires_at: number; // Timestamp in seconds
  expires_in: number;
}

const base_url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

export default async function getAccessToken(){
let token_res = await fetch(`${base_url}/auth/access-token`);
    let token_data:TokenData = await token_res.json()
    const token = token_data.token 
    return token
}