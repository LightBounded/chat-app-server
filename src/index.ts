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

  socket.on("messageCreate", (message) => {
    const newMessage = { ...message, id: randomUUID() };
    messages.push(newMessage);
    io.emit("messageCreate", newMessage);
  });

  socket.on("usersFetch", () => {
    io.emit("usersFetch", users);
  });

  socket.on("userCreate", (username) => {
    const newUser = { username, isOnline: false, id: randomUUID() };
    users.push(newUser);
    io.emit("userCreate", newUser);
  });

  socket.on("logIn", (userId) => {
    onlineUserIds.push(userId);

    const onlineUsers = users.map((u) => ({
      ...u,
      isOnline: onlineUserIds.includes(u.id),
    }));

    io.emit("usersFetch", onlineUsers);
  });

  socket.on("logOut", (userId) => {
    onlineUserIds = onlineUserIds.filter((uid) => uid !== userId);

    const onlineUsers = users.map((u) => {
      return {
        ...u,
        isOnline: onlineUserIds.includes(u.id),
      };
    });

    io.emit("usersFetch", onlineUsers);
  });

  socket.on("channelCreate", (channelName: string) => {
    const newChannel = { name: channelName, id: randomUUID() };
    channels.push(newChannel);
    io.emit("channelCreate", newChannel);
  });

  socket.on("disconnect", () => {
    console.log("a user has disconnected");
  });
});

// app.post("/login", (req, res) => {
//   const { userId } = req.body;

//   if (!onlineUserIds.includes(userId)) {
//     onlineUserIds.push(userId);
//   }

//   res.status(200).send();
// });

// app.post("/logout", (req, res) => {
//   const { userId } = req.body;

//   if (onlineUserIds.includes(userId)) {
//     onlineUserIds = onlineUserIds.filter((id) => id === userId);
//   }

//   res.status(200).send();
// });

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
