"use client"
import { Copy, Check, Ellipsis, TriangleAlert } from "lucide-react"
import RenderMarkdown from "../../Components/RenderMarkdown"
import { useState } from "react"

export default function Message({ prompt, response, status, file, done, loading }: { [key: string]: any }) {
    //console.log("Message Prompt -> ", prompt)
    const [copied, setCopied] = useState(false)
    let last = file ? file.split("/").at(-1).split("_") : null
    let filename = file ? `${last[0]}.${last.at(-1).split(".").at(-1)}` : null

    async function handleCopy() {
        await navigator.clipboard.writeText(response)
        setCopied(true)
        setTimeout(() => setCopied(false), 500)
    }

    return (
        <div className="flex flex-col m-0 p-0 pb-6">
            {file &&
                <div className="self-end m-2 rounded-2xl">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" className="self-end m-2 rounded-2xl h-[100px]" />
                    {filename}
                </div>
                //<img src={`http://localhost:8000/image/?Key=${encodeURIComponent(image)}`} alt="" className="self-end m-2 rounded-2xl" height={100} width={200} />
            }
            <div className="p-3 mb-6  rounded-3xl max-w-[80%] self-end bg-base-100 font-base-content">{prompt}</div>
            <div className="min-w-full self-start">
                {(status === "COMPLETED" || status == "INPROGRESS" || status == "STOPPED") ? < RenderMarkdown content={response} /> : (status === "ERROR") ? <span><TriangleAlert className="text-red-500" />Error</span> : <span className="p-2 ml-1 bg-base-content loading loading-dots loading-sm"></span>}
            </div>
            {done &&
                <div className=" mt-0 pt-0 flex flex-row gap-1">
                    <button>
                        {
                            copied ?
                                <Check size={34} className="p-2 pt-1 pb-1 ml-1 hover:rounded-[10px] hover:bg-base-300 max-sm:size-8" />
                                :
                                <Copy size={34} className="p-2 pt-1 pb-1 ml-1  hover:rounded-[10px] hover:bg-base-300 max-sm:size-8" onClick={handleCopy} />
                        }
                    </button>
                    <button>
                        <Ellipsis size={34} className="p-2 pt-1 pb-1  hover:rounded-[10px] hover:bg-base-300 max-sm:size-8" />
                    </button>
                </div>}
        </div>
    );
}



