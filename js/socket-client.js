// Connect to server
const SERVER_URL = window.location.hostname == 'localhost'
    ? 'https://localhost:3000'
    : window.location.origin;

console.log('Connect to the server:', SERVER_URL);


const socket = io(SERVER_URL);

socket.on('connect', () => {
    console.log('Connected to server! ID:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

export { socket };