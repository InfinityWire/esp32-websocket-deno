Deno.serve({ port: 8080 }, (req) => {
    if (req.headers.get("upgrade") !== "websocket") {
        return new Response("Not a WebSocket request", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
        console.log("Nuevo cliente conectado");
    };

    socket.onmessage = (event) => {
        const msgString = event.data.toString();
        console.log("Recibido:", msgString);
        // Reenviar a todos los clientes
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msgString);
            }
        }
    };

    socket.onclose = () => {
        console.log("Cliente desconectado");
    };

    socket.onerror = (error) => {
        console.error("Error:", error);
    };

    const wss = socket; // Guardamos referencia para broadcasting
    return response;
});