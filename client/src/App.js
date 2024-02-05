import io from "socket.io-client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Container,
} from "@mui/material";
import { IoCheckmark, IoCheckmarkDone, IoSend } from "react-icons/io5";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [messagesReadByRecipient, setMessagesReadByRecipient] = useState([]);

  const markMessageAsRead = (index) => {
    const updatedReadReceipts = { ...readReceipts };
    updatedReadReceipts[index] = true;
    setReadReceipts(updatedReadReceipts);
  };

  const joinRoom = () => {
    if (room !== "" && username !== "") {
      socket.emit("join_room", { room, username });
    }
  };

  const sendMessage = () => {
    const newMessageIndex = messages.length;
    socket.emit("send_message", {
      message,
      room,
      username,
      index: newMessageIndex,
    });
  };

  useEffect(() => {
    socket.on("user_online", (data) => {
      setOnlineUsers((prevUsers) => ({
        ...prevUsers,
        [data.username]: { status: "online", color: "#00FF00" },
      }));
    });

    socket.on("user_offline", (data) => {
      setOnlineUsers((prevUsers) => ({
        ...prevUsers,
        [data.username]: { status: "offline", color: "#FF0000" },
      }));
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      socket.emit("rejoin_room", { room, username });
    });

    socket.on("message_read", (data) => {
      markMessageAsRead(data.index);
      setMessagesReadByRecipient((prevMessages) => [
        ...prevMessages,
        data.index,
      ]);
    });

    return () => {
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("message_read");
    };
  }, [socket, onlineUsers, readReceipts]);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      socket.emit("message_received", { index: messages.length, room });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, messages, room]);

  return (
    <Container
      maxWidth="md"
      sx={{ my: 2, paddingLeft: "0 !important", paddingRight: "0 !important" }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        mt={4}
        p={3}
        bgcolor="#f5f5f5"
        borderRadius={2}
      >
        <Typography variant="h5" mb={2} color="black">
          Chat WebApp
        </Typography>
        <TextField
          fullWidth
          type="text"
          variant="outlined"
          placeholder="Your Name..."
          onChange={(event) => {
            setUsername(event.target.value);
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            flexDirection: {
              md: "row",
              xs: "column",
            },
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            mt={2}
            sx={{ width: { md: "50%", xs: "100%" } }}
          >
            <TextField
              variant="outlined"
              placeholder="Room Number..."
              onChange={(event) => {
                setRoom(event.target.value);
              }}
            />
            <Button onClick={joinRoom} variant="contained" color="primary">
              Join Room
            </Button>
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            mt={2}
            sx={{ width: { md: "50%", xs: "100%" } }}
          >
            <TextField
              type="text"
              variant="outlined"
              placeholder="Message..."
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
            />
            <Button onClick={sendMessage} variant="contained" color="secondary">
              Send Message <IoSend style={{ marginLeft: 6 }} fontSize={18} />
            </Button>
          </Box>
        </Box>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          mt: 4,
          paddingLeft: "0 !important",
          paddingRight: "0 !important",
        }}
      >
        <Typography variant="h5" textAlign="center">
          Messages:
        </Typography>
        <Box mt={2}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  msg.username === username ? "flex-end" : "flex-start",
                marginTop: "10px",
              }}
            >
              {msg.username !== username && (
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    sx={{
                      backgroundColor:
                        msg.username === username ? "#f50057" : "#3f51b5",
                    }}
                  >
                    {msg.username ? msg.username[0] : ""}
                  </Avatar>
                  {onlineUsers[msg.username] && (
                    <span
                      style={{
                        backgroundColor: onlineUsers[msg.username].color,
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                      }}
                    ></span>
                  )}
                </Box>
              )}

              <Box
                sx={{
                  borderRadius: 2,
                  p: "6px 12px",
                  mx: 2,
                  backgroundColor:
                    msg.username === username ? "#e3f2fd" : "#fce4ec",

                  maxWidth: "300px",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >{`${msg.message || ""}`}</Typography>
              </Box>

              {msg.username === username && (
                <Avatar
                  sx={{
                    backgroundColor:
                      msg.username === username ? "#f50057" : "#3f51b5",
                  }}
                >
                  {msg.username ? msg.username[0] : ""}
                </Avatar>
              )}

              {msg.username === username && (
                <Box
                  sx={{
                    ml: 1,
                    display: "flex",
                    alignItems: "end",
                    color: messagesReadByRecipient.includes(index)
                      ? "#00FF00"
                      : "#808080",
                  }}
                >
                  {messagesReadByRecipient.includes(index) ? (
                    <IoCheckmarkDone fontSize={16} />
                  ) : (
                    <IoCheckmark fontSize={16} />
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Container>
    </Container>
  );
}

export default App;
