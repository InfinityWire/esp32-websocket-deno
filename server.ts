// Usar Deno KV para broadcasting global
const kv = await Deno.openKv();

Deno.serve({ port: 8080 }, (req) => {
    if (req.headers.get("upgrade") !== "websocket") {
        return new Response("Not a WebSocket request", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
        console.log("Nuevo cliente conectado");
    };

    socket.onmessage = async (event) => {
        const msgString = event.data.toString();
        console.log("Recibido:", msgString);
        // Almacenar mensaje en KV con timestamp único
        const timestamp = Date.now();
        await kv.set(["messages", timestamp], { sender: socket, message: msgString });
    };

    socket.onclose = () => {
        console.log("Cliente desconectado");
    };

    socket.onerror = (error) => {
        console.error("Error:", error);
    };

    // Escuchar mensajes en KV y reenviarlos
    const broadcast = async () => {
        for await (const entry of kv.watch([["messages"]])) {
            for (const { key, value } of entry) {
                if (value && value.message && socket.readyState === WebSocket.OPEN) {
                    // No enviar al cliente que originó el mensaje
                    if (value.sender !== socket) {
                        socket.send(value.message);
                    }
                    // Limpiar mensaje procesado
                    await kv.delete(key);
                }
            }
        }
    };
    broadcast();

    return response;
});