"use client"
import ChatInput from "../ChatInput"
import MessageComponent from "../Message";
import { useState, useEffect, useRef, useContext } from "react"
import { useParams } from "next/navigation"
import { Message, Input, User } from "../../types/datamodel"
import { useRouter } from "next/navigation"
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { createRunOptions } from '@/src/app/api/Messages/createRun'
import { messageOptions } from '@/src/app/api/Messages/getMessages'
import { UserContext } from "../UserContext"


export default function Home() {

    const params = useParams()
    const router = useRouter()
    const ws_url = process.env.NEXT_PUBLIC_WS_BASE_URL
    const session_id = params.session?.toString()
    const user_data: User = useContext(UserContext)!
    const user_id = user_data.id
    const [messages, setMessages] = useState<Array<Message>>([])
    const [loading, setLoading] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const { data } = useSuspenseQuery(messageOptions(session_id))
    const messageMutation = useMutation(createRunOptions)

    useEffect(() => {
        setMessages([...data.data].reverse())
    }, [data])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const ws = new WebSocket(`${ws_url}/runs/${session_id}`);

        ws.onopen = () => {
            wsRef.current = ws;
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (data.type === "message") {
                setMessages((prev) => {
                    let updated = [...prev]
                    let last = updated.length - 1
                    updated[last] = {
                        ...updated[last],
                        response: updated[last].response + data.content,
                        status: data.status
                    }
                    return updated
                })
                if (data.status === "COMPLETED") setLoading(false)
            }
            else if (data.type === "stopped") {
                setLoading(false)
            }
            else if (data.type === "Error") {
                setLoading(false)
            }
        }

        ws.onclose = (event) => {
            console.log(`Connection closed, code ${event.code}, reason : ${event.reason}`);
            //window.location.reload();
        }

        ws.onerror = (error) => {
            console.log(`WebSocket Error : ${error}`)
        }

        return () => ws.close()
    }, [])


    async function handleSubmit(input: Input) {
        setLoading(true)

        const res = await messageMutation.mutateAsync({ user_id, session_id, input })
        console.log("TanStackQuery : Message post", res, res.data)

        setMessages((prev) => {
            let updated = [...prev]
            let last = {
                input: {
                    prompt: input.prompt,
                    file: res.data.input.file ? res.data.input.file : null
                },
                response: "",
                status: "STARTED"
            }

            updated.push(last)
            return updated
        })

        let wsreq = JSON.stringify({
            type: "start",
            Run: {
                user_id: user_id,
                input: {
                    prompt: input.prompt,
                    file: res.data.input.file ? res.data.input.file : null
                }
            }
        })
        wsRef.current?.send(wsreq)
    }

    function handleStop() {
        let wsreq = JSON.stringify({
            type: "stop"
        })
        wsRef.current?.send(wsreq)
        setLoading(false)
    }



    return (
        <>
            <div className="bg-base-200 h-full w-full overflow-y-auto flex flex-col sm:pl-8 md:pl-16 lg:pl-24 xl:pl-60 sm:pr-8 md:pr-16 lg:pr-24 xl:pr-60 no-scrollbar transition-all pt-6 max-sm:p-6">
                {
                    messages.map((msg, i) => {
                        return (<MessageComponent
                            key={i}
                            prompt={msg["input"]["prompt"]}
                            response={msg["response"]}
                            file={msg["input"]["file"]}
                            status={msg["status"]}
                            done={msg["status"] && (msg["status"].includes("STARTED") || msg["status"].includes("INPROGRESS")) ? false : true}
                            loading={loading}
                        />)
                    }
                    )
                }
                <div ref={bottomRef}></div>
            </div>
            <ChatInput onSubmit={handleSubmit} onStop={handleStop} loading={loading} />
            {/* <div className="p-2 text-xs">Ai responses may contain mistakes</div> */}
        </>
    );
}

