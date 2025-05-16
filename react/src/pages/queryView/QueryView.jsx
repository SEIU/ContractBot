import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { useTopic } from "../../contexts/TopicContext";
import { Box, Button, Container, Typography } from "@mui/material/";
import { useForm } from "react-hook-form";
import Categories from "./Categories";
import QuestionInput from "./QuestionInput";
import api from "../../api/api";
import Conversation from "./Conversation";
import { createAuthenticationParams } from "../../authentication/authentication";
import ModelPicker from "./ModelPicker";
import { useAuth } from "../../contexts/AuthContext";

// This component basically acts as a giant form, which registers inputs from various child
// components and handles submissions ond errors
function QueryView() {
  const { topics, updateCurrentTopic, updateTopicName, currentTopic } =
    useTopic();
  const [errorMessage, setErrorMessage] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const { user } = useAuth();
  const [isQuerying, setIsQuerying] = useState({
    isQuerying: false,
    message: null,
  });
  const [messages, setMessages] = useState([]);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      model: "default",
    },
  });

  useEffect(() => {
    clearMessages();
    fetchTopicThread(currentTopic.topicId);
  }, [currentTopic]);

  const onSubmit = async (question) => {
    setErrorMessage(null); // Reset server error on new submission
    setIsQuerying({ isQuerying: true, message: "Thinking..." });
    setValue("question", "");
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        type: "question",
        seq: question.seq,
        topic: question.topic,
        text: [question.question], // TODO why are we setting this as an array?
      },
    ]);
    let formData = {
      Topic: currentTopic.topicId,
      User: user.userName,
      Query: question.question,
      Modifiers: { Region: null, Category: question.categories },
      Model: question.model,
    };

    addQuery(formData);
  };

  const addQuery = async (formData) => {
    try {
      const authParams = await createAuthenticationParams();
      const url = `/add-query?${authParams}`;
      const response = await api.post(url, formData);

      if (response.status === 200) {
        // Successful POST, start GET check-query
        checkQueryWithRetries(response.data.Seq);
        // rename topic if first question of topic
        if (response.data.Seq === 1) {
          updateTopicName(currentTopic.topicId, formData.Query);
        }
      } else {
        // POST failed
        setErrorMessage("Sorry, something went wrong. Please try again.");
      }
    } catch (error) {
      if (error.response?.status === 429) {
        setErrorMessage(error.response.data.detail);
        setIsQuerying({ isQuerying: false, message: null });
        setValue("question", "");
      } else {
        console.error("There was an error and here it is: ", error);
        setErrorMessage("Sorry, something went wrong. Please try again.");
        setIsQuerying({ isQuerying: false, message: null });
        setValue("question", "");
      }
    }
  };

  const checkQueryWithRetries = async (querySeq, maxRetries = 3) => {
    updateCurrentTopic({
      topicId: currentTopic?.topicId,
      seq: querySeq,
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const authParamsGet = await createAuthenticationParams();
        const topic = currentTopic?.topicId;
        const seq = querySeq;
        const url = `check-query?${authParamsGet}&Topic=${topic}&Seq=${seq}`;
        const response = await api.get(url);
        if (response.data.Answer !== null) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              type: "answer",
              seq: response.data.Seq,
              topic: response.data.Topic,
              text: response.data.Answer,
            },
          ]);
          setIsQuerying({ isQuerying: false, message: null });
          return response.data;
        } else {
          console.log(`Attempt ${attempt}: Answer is null. Retrying...`);
          setIsQuerying({
            isQuerying: true,
            message: "I'm still working, please continue to wait...",
          });
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    setIsQuerying({ isQuerying: false, message: null });
    console.log(`Failed to get answer after ${maxRetries} attempts.`);
    fetchTopicThread(currentTopic.topicId);
    setErrorMessage(
      "Query is queued and will be answered as soon as possible."
    );
    return null;
  };

  const fetchTopicThread = async (topicId) => {
    setLoadingTopic(true);
    try {
      const authParamsGet = await createAuthenticationParams();
      let url = `get-topic-thread?${authParamsGet}&Topic=${topicId}`;
      const res = await api.get(url);
      if (res.status === 200 && res.data) {
        rerenderConversation(res.data);
        setErrorMessage(null);
      } else {
        setErrorMessage("Sorry, we couldn't fetch this topic.");
      }
      setLoadingTopic(false);
    } catch (error) {
      setLoadingTopic(false);
      setErrorMessage("Sorry, we couldn't fetch this topic.");
      console.log("Unable to fetch conversation about topic: ", error);
    }
  };

  const rerenderConversation = (data) => {
    let messages = [];
    data.forEach((message) => {
      let question = {
        type: "question",
        seq: message.Seq,
        topic: message.Topic,
        text: [message.Query], // TODO why are we setting this as an array?
      };
      let answer = {
        type: "answer",
        seq: message.Seq,
        topic: message.Topic,
        text: message.Answer,
      };
      messages.push(question);
      messages.push(answer);
    });
    setMessages(messages);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const getParams = async () => {
    let params = await createAuthenticationParams();
    console.log(params);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
          <ModelPicker register={register} watch={watch} />
          <Categories control={control} />
          {loadingTopic && <Typography>Loading topic...</Typography>}
          <Conversation
            messages={messages}
            errorMessage={errorMessage}
            isQuerying={isQuerying}
          />
          <QuestionInput register={register} isQuerying={isQuerying} />
        </Box>
      </form>
      {/* <Button onClick={getParams}>get params</Button> */}
    </>
  );
}

export default QueryView;
