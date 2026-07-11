"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function SocketListener() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is logged in
    if (status !== "authenticated" || !session?.user) return;

    // Use the custom server ID (prefer custom userId over MongoDB _id if present)
    const userId = session.user.userId || session.user.id;

    if (!socket) {
      // Connect to the same origin since we're using a custom server
      socket = io(window.location.origin, {
        path: "/socket.io",
      });

      socket.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to WebSocket");
        // Join the user's specific room
        socket?.emit("join", userId);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      // Listen for notifications
      socket.on("notification", (data: { message: string; jobId?: string }) => {
        toast.info(data.message, {
          duration: 5000,
        });
        // Refresh the current route to fetch new data (e.g. notifications list)
        router.refresh();
      });
    }

    return () => {
      // Don't disconnect immediately on unmount in React 18 strict mode, 
      // but clean up the listener to avoid duplicates
      if (socket) {
        socket.off("notification");
      }
    };
  }, [session, status, router]);

  return null; // This component doesn't render anything
}
