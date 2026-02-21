import { useEffect, useState, useRef } from "react";
import type { WsMessage } from "../types";

export const useInventorySocket = () => {
  const [latestUpdate, setLatestUpdate] = useState<WsMessage["data"] | null>(
    null,
  );
  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = () => {
    // Sắp xếp gửi token qua URL
    const token = localStorage.getItem("token");
    const wsUrl = token
      ? `ws://localhost:8080/ws?token=${token}`
      : "ws://localhost:8080/ws";

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WS Connected");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.event === "INVENTORY_UPDATED") {
          setLatestUpdate(msg.data);
        }
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    wsRef.current.onclose = () => {
      console.log("WS Disconnected. Trying to reconnect...");
      // Reconnect sau 3 giây
      timeoutRef.current = setTimeout(connect, 3000);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on explicit unmount
        wsRef.current.close();
      }
    };
  }, []);

  return { latestUpdate };
};
