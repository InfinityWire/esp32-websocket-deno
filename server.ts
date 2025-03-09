// Lista para rastrear todos los clientes conectados
const clients = new Set<WebSocket>();

Deno.serve({ port: 8080 }, (req) => {
    if (req.headers.get("upgrade") !== "websocket") {
        return new Response("Not a WebSocket request", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
        console.log("Nuevo cliente conectado");
        clients.add(socket); // Agregar cliente a la lista
    };

    socket.onmessage = (event) => {
        const msgString = event.data.toString();
        console.log("Recibido:", msgString);
        // Reenviar solo a los otros clientes
        for (const client of clients) {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(msgString);
            }
        }
    };

    socket.onclose = () => {
        console.log("Cliente desconectado");
        clients.delete(socket); // Eliminar cliente de la lista
    };

    socket.onerror = (error) => {
        console.error("Error:", error);
        clients.delete(socket); // Limpiar en caso de error
    };

    return response;
});