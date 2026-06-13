import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSessionOptions } from '@/src/app/api/Sessions/deleteSession'
import { useRouter } from "next/navigation";

export function SessionComponent({ ses, i, isActive }: { ses: any, i: any, isActive: boolean }) {

    const [more, setMore] = useState(false)
    const router = useRouter()
    const queryClient = useQueryClient()
    const deleteMutation = useMutation(deleteSessionOptions(ses.id, queryClient))


    function toggleMore() {
        setMore(!more);
    }

    function handleDeleteSession() {
        toggleMore()
        try {
            console.log(`Deleting session : ${ses.id}`)
            deleteMutation.mutate()
            console.log("Tanstackquery:mutate sessions", deleteMutation.data)
            router.push(`/chat/`)
        } catch (error) {
            console.error("Delete Mutation failed:", error);
        }
    }


    return (
        <div className={`relative flex items-center mb-1 group p-2 hover:rounded  ${isActive ? "bg-base-200" : "hover:bg-base-200"}`}>
            <Link href={`/chat/${ses.id}`} key={ses.id} className="self-start font-base-content  block" >{ses.name}</Link>
            <button className="ml-auto border-0" onClick={toggleMore}>
                <Ellipsis className="invisible group-hover:visible  hover:text-gray-500" size={20} />
            </button>
            {(more &&
                <div className="z-50 flex flex-col p-2 mt-2 mb-2 justify-start absolute left-20 top-0 bg-base-100 rounded w-30 text-[15px] gap-1">
                    {/* <div className="w-full flex items-center hover:bg-base-300 rounded p-1 text-15px">
                        <Pencil className="mr-1" size={14} /><span>Rename</span>
                    </div> */}
                    <div className="text-red-500 w-full flex items-center hover:bg-red-200 rounded p-1 text-15px" onClick={(e) => handleDeleteSession()}>
                        <Trash2 className="mr-1" size={16} /> <span>Delete</span>
                    </div>
                </div>
            )}
        </div>
    );
}