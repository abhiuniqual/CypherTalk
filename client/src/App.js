import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Container,
  IconButton,
} from "@mui/material";
import { IoCheckmark, IoCheckmarkDone, IoSend, IoClose } from "react-icons/io5";
import OnlineIcon from "../src/assets/onlineIcon.png";
import moment from "moment";
import "./App.css";

const socket = io.connect("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [messagesReadByRecipient, setMessagesReadByRecipient] = useState([]);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  const markMessageAsRead = (index) => {
    const updatedReadReceipts = { ...readReceipts };
    updatedReadReceipts[index] = true;
    setReadReceipts(updatedReadReceipts);
  };

  const joinRoom = () => {
    if (room !== "" && username !== "") {
      socket.emit("join_room", { room, username });
    }

    setHasJoinedRoom(true);
  };

  const sendMessage = () => {
    const newMessageIndex = messages.length;
    const timestamp = moment().format("hh:mm A");
    socket.emit("send_message", {
      message,
      room,
      username,
      index: newMessageIndex,
      timestamp,
    });
    messageInputRef.current.value = "";
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

  const messageInputRef = useRef(null);

  return (
    <Container
      maxWidth="lg"
      sx={{
        my: 2,
        paddingLeft: "0 !important",
        paddingRight: "0 !important",
      }}
    >
      <Box m={2}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f5f5f5",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          <Typography variant="h4" mb={2} color="teal" fontWeight="500">
            CypherTalk
          </Typography>
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={2}
            mt={2}
          >
            <TextField
              fullWidth
              type="text"
              variant="outlined"
              placeholder="Your Name..."
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            />
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Room Number..."
              onChange={(event) => {
                setRoom(event.target.value);
              }}
            />
            <Button
              onClick={joinRoom}
              variant="contained"
              color="success"
              sx={{
                width: {
                  md: "50%",
                  xs: "100%",
                },
              }}
            >
              Join Room
            </Button>
          </Box>
        </Box>

        {hasJoinedRoom ? (
          <Container
            maxWidth="md"
            sx={{
              mt: 4,
              paddingLeft: "0 !important",
              paddingRight: "0 !important",
            }}
          >
            <Box
              sx={{
                p: 2,
                height: "450px",
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  pb: 1,
                  borderBottom: 1,
                  borderColor: "#60A5FA",
                }}
              >
                <Box display="flex" alignItems="center">
                  <img
                    src={OnlineIcon}
                    alt="online"
                    style={{ height: "14px", marginRight: 2 }}
                  />
                  <Typography variant="h6">{room}</Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 2,
                    p: "6px 12px",
                    mx: 2,
                    backgroundColor: "#D1FAE5",
                    maxWidth: "300px",
                  }}
                >
                  <Typography variant="body1">{`Hi ${username}, glad you're in room ${room}!`}</Typography>
                </Box>
                <IconButton onClick={() => setHasJoinedRoom(false)}>
                  <IoClose size={24} />
                </IconButton>
              </Box>
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  my: 1,
                }}
              >
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
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
                          {msg.username ? msg.username[0].toUpperCase() : ""}
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
                        display: "flex",
                        alignItems: "center",
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
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{
                          ml: 2,
                          fontSize: "10px",
                        }}
                      >
                        {msg.timestamp}
                      </Typography>
                    </Box>

                    {msg.username === username && (
                      <Avatar
                        sx={{
                          backgroundColor:
                            msg.username === username ? "#f50057" : "#3f51b5",
                        }}
                      >
                        {msg.username ? msg.username[0].toUpperCase() : ""}
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

              <Box display="flex" gap={2} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  type="text"
                  variant="outlined"
                  placeholder="Type a message..."
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                  inputRef={messageInputRef}
                />
                <Button
                  onClick={sendMessage}
                  variant="contained"
                  color="success"
                >
                  <IoSend fontSize={24} />
                </Button>
              </Box>
            </Box>
          </Container>
        ) : (
          <Typography my={2} variant="h6" color="teal" textAlign="center">
            Join a room and start chatting!
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default App;
