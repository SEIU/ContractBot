import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { createAuthenticationParams } from "../../authentication/authentication";
import { useTopic } from "../../contexts/TopicContext";
import { Box, Button, Container, Typography } from "@mui/material/";

function DocumentsView() {
  const [documents, setDocuments] = useState([]);
  const { currentTopic } = useTopic();

  useEffect(() => {
    getLookupDocuments();
  }, [currentTopic]);

  const getLookupDocuments = async () => {
    try {
      const authParams = await createAuthenticationParams();
      const url = `/get-lookups?${authParams}&Topic=${currentTopic.topicId}`;
      const res = await api.get(url);
      if (res.data) {
        setDocuments(res.data.Lookups);
      } else {
        console.log("No data in response: ", res);
      }
    } catch (error) {
      // handle error
      console.error("There was an error and here it is: ", error);
    }
  };

  return (
    <>
      <Typography>{`Reference Documents for ${currentTopic.topicName}`}</Typography>
      {documents.length === 0 ? (
        <Typography>No documents to show</Typography>
      ) : (
        documents.map((document) => (
          <>
            <Typography>{document.Query}</Typography>
            {/* {document.Fragments.map((fragment) => (
              // ugh
            ))} */}
          </>
        ))
      )}
    </>
  );
}

export default DocumentsView;
