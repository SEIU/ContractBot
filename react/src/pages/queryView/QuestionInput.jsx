import React from "react";
import { Box, TextField, Button, Alert } from "@mui/material/";

function QuestionInput({ register, isQuerying }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }
  };

  return (
    <Box sx={{ marginTop: "10px" }}>
      <TextField
        sx={{ width: "70%" }}
        label="Ask your question"
        multiline
        variant="outlined"
        disabled={isQuerying.isQuerying}
        {...register("question")}
        onKeyDown={handleKeyDown}
      />
      <Button
        sx={{ height: "56px", width: "85px", marginLeft: "15px" }}
        variant="contained"
        type="submit"
        onClick={handleKeyDown}
        disabled={isQuerying.isQuerying}
      >
        Ask
      </Button>
    </Box>
  );
}

export default QuestionInput;
