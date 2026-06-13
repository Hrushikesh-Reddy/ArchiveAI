"use client"
import { useState, useEffect, useContext } from "react";
import { useRouter, useParams } from "next/navigation";
import { Session } from "../types/datamodel"
import { useUser } from "@auth0/nextjs-auth0";
import { SessionComponent } from "@/Components/Session";
import { sessionOptions } from '@/src/app/api/Sessions/getSession'
import { mutateSessionOptions } from '@/src/app/api/Sessions/createSession'
import { SquarePen, Ellipsis, LogOut, Settings, PanelLeft } from "lucide-react"
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserContext } from "./UserContext"


export default function Sidebar() {

    const [sidebar, setSidebar] = useState<boolean>(true)
    const { user, error, isLoading } = useUser();
    const router = useRouter()
    const params = useParams();
    const user_data = useContext(UserContext)
    const queryClient = useQueryClient()
    const { data } = useSuspenseQuery(sessionOptions(user_data == undefined ? null : user_data?.id))
    const mutation = useMutation(mutateSessionOptions(user_data == undefined ? null : user_data?.id, queryClient))
    const base_url = process.env.NEXT_PUBLIC_URL

    useEffect(() => {
        if (data.data !== undefined && data.data.length > 0) {
            [...data.data].sort((a: Session, b: Session) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
        }
    }, [data])

    async function handleCreateSession() {
        try {
            console.log("creating session")
            mutation.mutate()
            //console.log("Tanstackquery:mutate sessions", mutation.data?.data)
            if (mutation.data)
                router.push(`/chat/${mutation.data.data.id}`)
        } catch (error) {
            console.error("Mutation failed:", error);
        }
    }

    return (
        <>
            {/* Sidebar */}
            <aside className={`overflow-x-hidden p-4 flex flex-col bg-base-300 whitespace-nowrap ${sidebar ? "min-w-66" : "max-w-12.5"} max-sm:hidden`}>

                <button className="p-1 hover:cursor-e-resize hover:bg-base-300 hover:rounded min-w-7 max-w-7 outline-0" onClick={() => setSidebar(!sidebar)}>
                    <PanelLeft size={20} className="min-w-5 hover:bg-base-300" />
                </button>


                <nav className="flex flex-col gap-3">
                    <div onClick={() => handleCreateSession()} className={`flex items-center gap-2 rounded w-7 hover:bg-base-200 p-1 mt-4`}>
                        <SquarePen size={20} className="min-w-5" />
                        <span className={`${sidebar ? "" : "hidden"}`}>New Chat</span>
                    </div>
                </nav>
                <div className={`flex-1 min-h-0 overflow-y-auto mt-4 overflow-x-clip ${sidebar ? "" : "invisible"} }`}>
                    <h2 className="text-lg font-bold pb-2">Chats</h2>
                    <div className="p-4 pt-0 pl-0 rounded flex flex-col">
                        {data.data &&
                            data.data.map((ses: Session, i: string) =>
                                (<SessionComponent ses={ses} i={i} key={i} isActive={params?.session === ses.id} />)
                            )
                        }
                    </div>
                </div>

                {/* User */}
                {(!error && !isLoading && <div className="dropdown dropdown-top">
                    <div tabIndex={0} role="button" className={`btn bg-base-300 border-0 min-w-7 hover:bg-base-100 w-full mt-4 flex flex-row items-center justify-start p-4 ${sidebar ? "" : "pl-0"}`}>
                        <img src={user?.picture} alt="" className="min-h-6.25 min-w-6.25 h-6.25 w-6.25 rounded-full " />
                        <div>{sidebar ? user?.name : ""}</div>
                        <Ellipsis size={20} />
                    </div>
                    <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                        {/* <li><button>
                            <Settings size={18} />
                            Settings
                        </button></li> */}
                        <li><a href={`/auth/logout?returnTo=${base_url}/`}>
                            <LogOut size={18} />
                            Log out
                        </a></li>
                    </ul>
                </div>)}

            </aside ></>
    );
}