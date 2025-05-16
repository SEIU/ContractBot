import React, { useState } from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function ModelPicker({ register, watch }) {
  const [showSelector, setShowSelector] = useState(false);
  const selectedModel = watch("model");
  const models = [
    {
      name: "qwq",
      description:
        "Alternative | Sometimes better than default | ~50s for response",
      value: "alternate",
    },
    {
      name: "deepseek-r1:32b",
      description:
        "Recommended | High quality answers, balanced | ~40s for response",
      value: "default",
    },
    {
      name: "gemma3:27b",
      description: "Fast | Good quality loquacious answers | ~30s for response",
      value: "faster",
    },
    {
      name: "deepseek-r1:7b",
      description: "Fastest | Lower quality answers | ~15s for response",
      value: "fastest",
    },
  ];

  // get the label for the selected model
  const getSelectedModelLabel = () => {
    const foundModel = models.find((model) => model.value === selectedModel);
    return foundModel ? foundModel.name : "";
  };

  const toggleShowSelector = () => {
    setShowSelector(!showSelector);
  };

  return (
    <>
      <InputLabel onClick={toggleShowSelector}>
        {selectedModel ? `Model: ${getSelectedModelLabel()}` : "Model"}
      </InputLabel>
      {showSelector && (
        <select {...register("model")}>
          {models &&
            models.map((model) => (
              <option key={model.value} value={model.value}>
                {model.name} | {model.description}
              </option>
            ))}
        </select>
      )}
    </>
  );
}
