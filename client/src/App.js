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

const socket = io.connect("http://localhost:3001");

function App() {
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");

  const joinRoom = () => {
    if (room !== "" && username !== "") {
      socket.emit("join_room", { room, username });
    }
  };

  const sendMessage = () => {
    socket.emit("send_message", { message, room, username });
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket]);

  // useEffect(() => {
  //   socket.on("receive_message", (data) => {
  //     setMessages((prevMessages) => [...prevMessages, data]);
  //   });
  // }, [socket]);

  return (
    <Container
      maxWidth="xl"
      sx={{ paddingLeft: "0 !important", paddingRight: "0 !important" }}
    >
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box width="400px">
          <TextField
            fullWidth
            type="text"
            placeholder="Your Name..."
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
        </Box>
        <Box width="400px" display="flex" gap={2} mt={2}>
          <TextField
            placeholder="Room Number..."
            onChange={(event) => {
              setRoom(event.target.value);
            }}
          />
          <Button onClick={joinRoom} variant="contained" color="warning">
            Join Room
          </Button>
        </Box>
        <Box width="400px" display="flex" gap={2} mt={2}>
          <TextField
            type="text"
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
            Send Message
          </Button>
        </Box>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          paddingLeft: "0 !important",
          paddingRight: "0 !important",
          marginTop: 2,
        }}
      >
        <Typography variant="h5">Messages:</Typography>
        <Box sx={{ mx: 4, mt: 2 }}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  msg.username === username ? "flex-end" : "flex-start",
                marginTop: "5px",
              }}
            >
              {msg.username !== username && (
                <Avatar
                  sx={{
                    backgroundColor:
                      msg.username === username ? "#3f51b5" : "#f50057",
                  }}
                >
                  {msg.username ? msg.username[0] : ""}
                </Avatar>
              )}

              <Typography
                variant="body1"
                sx={{
                  ml: msg.username === username ? 0 : 2,
                  mr: msg.username === username ? 2 : 0,
                }}
              >{`${msg.message || ""}`}</Typography>

              {msg.username === username && (
                <Avatar
                  sx={{
                    backgroundColor:
                      msg.username === username ? "#3f51b5" : "#f50057",
                  }}
                >
                  {msg.username ? msg.username[0] : ""}
                </Avatar>
              )}
            </Box>
          ))}
        </Box>
      </Container>
    </Container>
  );
}

export default App;
