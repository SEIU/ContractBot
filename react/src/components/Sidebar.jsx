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

export default function Sidebar() {
  // [{topicId: "abc123", topicName: "What is life?", isCurrent: true, seq: 2}, ...]
  const { topics, setTopics, setNewCurrentTopic } = useTopic();

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
    <Box sx={{ width: "250px", marginRight: "10px" }}>
      <Button onClick={handleNewTopicClick}>
        <AddIcon />
        new topic
      </Button>
      <nav>
        {topics.length && (
          <List>
            {topics.map((topic) => (
              <ListItem
                disablePadding
                key={topic.topicId}
                onClick={(e) => handleSelectTopic(topic)}
              >
                <ListItemButton>
                  <ListItemText
                    primary={topic.topicName}
                    sx={{
                      color: topic.isCurrent ? "purple" : "inherit",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </nav>
    </Box>
  );
}
