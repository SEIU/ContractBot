import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Container, Typography } from "@mui/material/";

import Sidebar from "../../components/Sidebar";
import DocumentsView from "../documentsView/DocumentsView";
import QueryView from "../queryView/QueryView";

function MainView() {
  const [view, setView] = useState("queries");

  return (
    <Box sx={{ display: "flex", marginTop: "100px" }}>
      <Sidebar />
      <Box sx={{ width: "100%", margin: "0 20px 20px 40px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <Button
            sx={{ width: "100%", marginRight: "7px" }}
            variant={view === "queries" ? "contained" : "outlined"}
            onClick={() => setView("queries")}
          >
            Queries
          </Button>
          <Button
            sx={{ width: "100%" }}
            variant={view === "documents" ? "contained" : "outlined"}
            onClick={() => setView("documents")}
          >
            Documents
          </Button>
        </Box>
        {view === "queries" ? <QueryView /> : <DocumentsView />}
      </Box>
    </Box>
  );
}

export default MainView;
