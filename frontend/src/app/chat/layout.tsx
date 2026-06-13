"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getQueryClient } from '@/app/api/get-query-client'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { sessionOptions } from '@/src/app/api/Sessions/getSession'
import { userOptions } from '@/src/app/api/Sessions/getUser'
import { useUser } from "@auth0/nextjs-auth0";
import { useSuspenseQuery } from '@tanstack/react-query'
import { Sun, Moon, } from "lucide-react"
import Sidebar from "./Sidebar";
import { UserContext } from "./UserContext"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()
  const [isDark, setIsDark] = useState(true)
  const { user, error, isLoading } = useUser();
  const user_data = useSuspenseQuery(userOptions()).data?.data
  const queryClient = getQueryClient()
  queryClient.prefetchQuery(sessionOptions((user_data == null || user_data == undefined) ? null : user_data[0]?.id))

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserContext.Provider value={user_data[0]}>
        <div className="flex max-h-screen" data-theme={`${isDark ? "halloween" : "wireframe"}`}>
          <Sidebar />
          {/* Content */}
          <main className="flex flex-col w-full h-screen justify-end items-center bg-base-200">
            <header className="sticky top-0 shadow-md w-full h-12.5  p-4 text-2xl flex items-center justify-between bg-base-200  ">
              <h1 className="text-xl">ArchiveAI</h1>
              <button className="btn border-0 rounded-full hover:bg-base-100">
                {
                  isDark ? <Sun size={25} color={"white"} onClick={e => setIsDark(!isDark)} />
                    :
                    <Moon size={25} onClick={e => setIsDark(!isDark)} />
                }
              </button>
            </header>
            {children}
          </main>
        </div >
      </UserContext.Provider>
    </HydrationBoundary>
  );
} 