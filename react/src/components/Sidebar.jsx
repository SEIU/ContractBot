import React, { useState, useEffect } from "react";
import { useTopic, createTopic } from "../contexts/TopicContext";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
} from "@mui/material/";
import AddIcon from "@mui/icons-material/Add";

export default function Sidebar({ view }) {
  // [{topicId: "abc123", topicName: "What is life?", isCurrent: true, seq: 2}, ...]
  const { topics, setTopics, setNewCurrentTopic, currentTopic } = useTopic();

  // create a new topic, add to the list of topics, set as current topic
  const handleNewTopicClick = () => {
    let newTopic = createTopic();
    setTopics((prevTopics) => [...prevTopics, newTopic]);
    setNewCurrentTopic(newTopic);
  };

  // set as current topic
  const handleSelectTopic = async (topic) => {
    setNewCurrentTopic(topic);
  };

  return (
    <Box
      sx={{
        marginTop: "85px",
        width: "300px",
      }}
      className="scrollable-content"
    >
      <nav>
        {topics?.length && (
          <List sx={{ padding: "0px" }}>
            {topics.map((topic) => (
              <ListItem
                disablePadding
                key={topic.topicId}
                onClick={(e) => handleSelectTopic(topic)}
              >
                <ListItemButton
                  selected={currentTopic?.topicId === topic.topicId}
                  sx={{
                    // styles for un-selected ListItemButton
                    color: "secondary.contrastText",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    // styles for "selected" ListnItemButton
                    // MUI adds the .Mui-selected class when 'selected' is true
                    "&.Mui-selected": {
                      backgroundColor: "secondary.main",
                      color: "secondary.contrastText",

                      "&:hover": {
                        backgroundColor: "secondary.dark",
                      },
                    },
                  }}
                >
                  <ListItemText primary={topic.topicName} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </nav>
      {view === "queries" && (
        <Button
          onClick={handleNewTopicClick}
          sx={{ margin: "5px 5px 15px 5px", flexShrink: 0, width: "100%" }}
          variant="outlined"
        >
          <AddIcon />
          new topic
        </Button>
      )}
    </Box>
  );
}
