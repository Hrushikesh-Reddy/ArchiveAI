export const dynamic = 'force-dynamic';
import ChatInput from "./ChatInput"
import { Input } from "@/src/app/types/datamodel"
import { useUser } from "@auth0/nextjs-auth0";

export default function Home() {

  /* //const { user, error, isLoading } = useUser();

  async function handleSubmit(input: Input) {
    while (isLoading) continue
    let jstr = JSON.stringify({
      user: user?.name,
      prompt: input.prompt
    })
    console.log(jstr)
  } */
  return (
    <>
      <div className="text-white text-2xl h-full">Placeholder</div>
      {/* <div className="h-full w-[100%] overflow-auto flex flex-col pl-50 pr-50 no-scrollbar">
        {
          messages.map((msg, i) =>
          (<Message
            key={i}
            prompt={msg["prompt"]}
            response={msg["response"]}
            done={msg["done"] == undefined ? true : msg["done"]}
          />)
          )
        }
      </div> */}
      {/* <ChatInput onSubmit={handleSubmit} loading={false} onStop={() => { }} /> */}
      <div className="p-2 text-xs text-zinc-400">Ai responses may contain mistakes</div>
    </>
  );
}

