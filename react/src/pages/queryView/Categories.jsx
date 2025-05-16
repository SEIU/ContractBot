import React from "react";
import { Button, Box } from "@mui/material";
import { Controller } from "react-hook-form";

function Categories({ control }) {
  const categories = [
    "wages",
    "benefits",
    "PTO",
    "healthcare",
    "building services",
    "public",
    "private",
    "immigration",
    "grievances",
    "contract language",
  ];

  return (
    <>
      <Controller
        name="categories"
        control={control}
        defaultValue={[]}
        render={({ field: { onChange, value } }) => {
          const handleCategoryClick = (category) => {
            const updatedCategories = value.includes(category)
              ? value.filter((c) => c !== category)
              : [...value, category];
            onChange(updatedCategories);
          };

          return (
            <Box sx={{ margin: "18px 0" }}>
              {categories.map((category) => (
                <Button
                  key={category}
                  sx={{ marginRight: "7px", marginBottom: "7px" }}
                  onClick={() => handleCategoryClick(category)}
                  variant={value.includes(category) ? "contained" : "outlined"} //add visual feedback
                >
                  {category}
                </Button>
              ))}
            </Box>
          );
        }}
      />
    </>
  );
}

export default Categories;
