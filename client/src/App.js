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
  Stack,
  Popover,
} from "@mui/material";
import { IoCheckmark, IoCheckmarkDone, IoSend, IoClose } from "react-icons/io5";
import { LuSmile } from "react-icons/lu";
import EmojiPicker from "emoji-picker-react";
import OnlineIcon from "../src/assets/onlineIcon.png";
import moment from "moment";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  // const [isTyping, setIsTyping] = useState(false);
  const [anchorElForEmojiPicker, setAnchorElForEmojiPicker] = useState(null);
  const openEmojiPicker = Boolean(anchorElForEmojiPicker);

  const handleClickSmileyButton = (e) => {
    setAnchorElForEmojiPicker(e.currentTarget);
  };

  const handleCloseEmojiPicker = () => {
    setAnchorElForEmojiPicker(null);
  };

  const markMessageAsRead = (index) => {
    const updatedReadReceipts = { ...readReceipts };
    updatedReadReceipts[index] = true;
    setReadReceipts(updatedReadReceipts);
  };

  const joinRoom = () => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    const roomRegex = /^\d+$/;

    if (
      room !== "" &&
      username !== "" &&
      nameRegex.test(username) &&
      roomRegex.test(room)
    ) {
      socket.emit("join_room", { room, username });
      setHasJoinedRoom(true);
      toast.success("You've joined the room successfully!");
    } else {
      toast.error(
        "Name must contain only letters, and room number must contain only digits."
      );
    }
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

  // const handleTyping = (event) => {
  //   setMessage(event.target.value);
  //   if (event.target.value !== "") {
  //     socket.emit("typing", { room, username });
  //     setIsTyping(true);
  //   } else {
  //     setIsTyping(false);
  //   }
  // };

  useEffect(() => {
    socket.on("user_online", (data) => {
      setOnlineUsers((prevUsers) => ({
        ...prevUsers,
        [data.username]: { status: "online", color: "#4CAF50" },
      }));
    });

    socket.on("user_offline", (data) => {
      setOnlineUsers((prevUsers) => ({
        ...prevUsers,
        [data.username]: { status: "offline", color: "#F44336" },
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

    // socket.on("existing_messages", (existingMessages) => {
    //   setMessages(existingMessages);
    // });

    // socket.on("user_typing", (typingUsers) => {
    //   const isUserTyping = typingUsers.some((user) => user !== username);
    //   setIsTyping(isUserTyping);
    // });

    return () => {
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("message_read");
      // socket.off("existing_messages");
      // socket.off("user_typing");
    };
  }, [socket, onlineUsers, readReceipts]);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      socket.emit("message_received", { index: messages.length, room });
    };

    socket.on("receive_message", handleReceiveMessage);
    // socket.emit("get_existing_messages", { room });

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
      <ToastContainer />
      <Box m={2}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ECEFF1",
            borderRadius: "8px",
          }}
        >
          <Typography variant="h4" mb={2} color="#1565C0" fontWeight="500">
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
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
              }}
            />
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Room Number..."
              value={room}
              onChange={(event) => {
                setRoom(event.target.value);
              }}
            />
            <Button
              onClick={joinRoom}
              variant="contained"
              color="primary"
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
                backgroundColor: "#ECEFF1",
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
                  borderColor: "#90A4AE",
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
                    backgroundColor: "#C8E6C9",
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
                              msg.username === username ? "#1976D2" : "#F44336",
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
                      {/* {isTyping && (
                        <Typography variant="body2" color="textSecondary">
                          Someone is typing...
                        </Typography>
                      )} */}
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
                            msg.username === username ? "#1976D2" : "#F44336",
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
                            ? "#4CAF50"
                            : "#9E9E9E",
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

              <Stack
                px="16px"
                pb="16px"
                pt="8px"
                direction="row"
                gap="15px"
                alignItems="center"
              >
                <Popover
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  anchorEl={anchorElForEmojiPicker}
                  onClose={handleCloseEmojiPicker}
                  open={openEmojiPicker}
                >
                  <EmojiPicker
                    style={{
                      fontFamily: "Poppins, sans-serif !important",
                    }}
                    open={openEmojiPicker}
                    lazyLoadEmojis
                    onEmojiClick={(e) => {
                      setMessage(message + e.emoji);
                    }}
                  />
                </Popover>
                <TextField
                  inputRef={messageInputRef}
                  autoComplete="off"
                  type="text"
                  variant="outlined"
                  placeholder="Type message..."
                  fullWidth
                  name="message"
                  sx={{
                    ".MuiInputBase-root": {
                      height: "54px",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <IconButton
                        sx={{ ml: -1 }}
                        onClick={(e) => handleClickSmileyButton(e)}
                      >
                        <LuSmile />
                      </IconButton>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={sendMessage}
                >
                  <IoSend fontSize={24} />
                </Button>
              </Stack>
            </Box>
          </Container>
        ) : (
          <Typography my={2} variant="h6" color="#1565C0" textAlign="center">
            Join a room and start chatting!
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default App;
