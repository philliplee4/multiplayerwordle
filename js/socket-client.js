// Connect to server
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to server! ID:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

export { socket };