import cors from "cors";
import { randomUUID } from "crypto";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.json());
app.use(cors());

const server = createServer(app);
const io = new Server(server);

type Channel = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  channelId: string;
  userId: string;
  message: string;
};

type User = {
  id: string;
  username: string;
};

let messages: Message[] = [];
let users: User[] = [];
let channels: Channel[] = [];
let onlineUserIds: string[] = [];

function fetchAndEmitUsers() {}

io.on("connection", (socket) => {
  console.log("a user has connected");

  socket.on("message", (message) => {
    messages.push(message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("a user has disconnected");
  });
});

app.post("/login", (req, res) => {
  const { userId } = req.body;

  if (!onlineUserIds.includes(userId)) {
    onlineUserIds.push(userId);
  }

  res.status(200).send();
});

app.post("/logout", (req, res) => {
  const { userId } = req.body;

  if (onlineUserIds.includes(userId)) {
    onlineUserIds = onlineUserIds.filter((id) => id === userId);
  }

  res.status(200).send();
});

app.post("/users", (req, res) => {
  const { username } = req.body;

  if (users.find((u) => u.username === username)) {
    return res.status(400).send("user already exists");
  }

  const user = {
    id: randomUUID(),
    username,
  };

  users.push(user);

  res.json(user);
});

app.post("/channel", (req, res) => {
  const channel: Channel = req.body;

  if (channels.find((c) => c.name === channel.name)) {
    return res.status(400).json({ message: "channel already exists" });
  }

  channels.push(channel);

  res.json(channel);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
