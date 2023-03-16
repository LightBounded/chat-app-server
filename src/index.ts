import cors from "cors";
import { randomUUID } from "crypto";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.use(express.json());
app.use(cors());

type Channel = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  channelId: string;
  userId: string;
  text: string;
};

type User = {
  id: string;
  username: string;
  isOnline: boolean;
};

let messages: Message[] = [];
let users: User[] = [];
let channels: Channel[] = [];
let onlineUserIds: string[] = [];

io.on("connection", (socket) => {
  console.log("a user has connected");

  socket.on("messagesFetch", () => {
    io.emit("messagesFetch", messages);
  });

  socket.on("messageCreate", ({ messageText, channelId, userId }) => {
    const newMessage = {
      text: messageText,
      channelId,
      userId,
      id: randomUUID(),
    };
    messages.push(newMessage);
    io.emit("messageCreate", newMessage);
  });

  socket.on("usersFetch", () => {
    io.emit("usersFetch", users);
  });

  socket.on("userCreate", (username) => {
    if (users.find((u) => u.username === username)) return;

    const newUser = { username, isOnline: false, id: randomUUID() };
    users.push(newUser);
    io.emit("userCreate", newUser);
  });

  socket.on("logIn", (userId) => {
    if (onlineUserIds.includes(userId)) return;

    onlineUserIds.push(userId);

    const onlineUsers = users.map((u) => ({
      ...u,
      isOnline: onlineUserIds.includes(u.id),
    }));

    users = onlineUsers;

    io.emit("usersFetch", onlineUsers);
  });

  socket.on("logOut", (userId) => {
    if (!onlineUserIds.includes(userId)) return;

    onlineUserIds = onlineUserIds.filter((uid) => uid !== userId);

    const onlineUsers = users.map((u) => {
      return {
        ...u,
        isOnline: onlineUserIds.includes(u.id),
      };
    });

    users = onlineUsers;

    io.emit("usersFetch", onlineUsers);
  });

  socket.on("channelCreate", (channelName: string) => {
    if (channels.find((c) => c.name === channelName)) return;

    const newChannel = { name: channelName, id: randomUUID() };
    channels.push(newChannel);
    io.emit("channelCreate", newChannel);
  });

  socket.on("channelsFetch", () => {
    io.emit("channelsFetch", channels);
  });

  socket.on("disconnect", () => {
    console.log("a user has disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
