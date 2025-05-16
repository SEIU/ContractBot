import React, { useEffect, useState, useRef } from "react";
import { Alert, Box, Button, Paper, Typography, Tooltip } from "@mui/material";
import { createAuthenticationParams } from "../../authentication/authentication";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../api/api";
import { useTopic } from "../../contexts/TopicContext";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import LinearProgress from "@mui/material/LinearProgress";

function Conversation({ messages, errorMessage, isQuerying }) {
  const { currentTopic } = useTopic();
  const bottomRef = useRef(null);

  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const Egg = ({ line }) => {
    return line.toLowerCase().includes("easter egg") && Math.random() < 0.1 ? (
      <img
        alt="Software is mysterious!"
        src="/Ideas-are-illusions.jpg"
        style={{ height: "14em", paddingLeft: "2em" }}
      />
    ) : null;
  };

  const addLookup = async (fragment) => {
    // make addLookup request
    try {
      const authParams = await createAuthenticationParams();
      const url = `/add-lookup?${authParams}`;
      const body = {
        Topic: currentTopic.topicId,
        Seq: currentTopic.seq,
        Fragment: fragment,
        Count: 5,
        Threshold: 1,
      };
      const res = await api.post(url, body);
      console.log("res: ", res);
    } catch (error) {
      // handle error
      console.error("There was an error andn here it is: ", error);
    }
  };

  const Question = ({ text }) => {
    console.log("question text = ", text);
    return (
      <>
        <Box
          sx={{
            padding: "6px 12px",
            backgroundColor: "#c6a0f063",
            borderRadius: "4px",
          }}
        >
          {text.map((line) => (
            <Typography>{line}</Typography>
          ))}
        </Box>
      </>
    );
  };

  const Answer = ({ text }) => {
    return (
      <Box sx={{ display: "flex", position: "relative" }}>
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          {text.map((line) => {
            return (
              <>
                <Egg line={line} />
                <ReactMarkdown children={line} remarkPlugins={[remarkGfm]} />
              </>
            );
          })}
        </Box>
        <Box>
          <Button
            sx={{
              position: "absolute",
              bottom: "0",
              right: "0",
              minWidth: "auto",
            }}
            color="primary"
            onClick={() => addLookup(text.join())}
          >
            {/* TODO mark "already added" fragments */}
            <Tooltip
              title={`Add reference material for this answer to the Documents tab.`}
            >
              <PlaylistAddIcon />
            </Tooltip>
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <>
      {messages.length > 0 && (
        <>
          <Box>
            {messages.map((message, index) =>
              message.type === "question" ? (
                <Question text={message.text} />
              ) : (
                <Answer text={message.text} />
              )
            )}
          </Box>
          <>
            {isQuerying.isQuerying && (
              <>
                <Typography sx={{ marginBottom: "5px", padding: "10px" }}>
                  {isQuerying.message}
                </Typography>
                <LinearProgress />
              </>
            )}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          </>
          <div ref={bottomRef} />
        </>
      )}
    </>
  );
}

export default Conversation;
