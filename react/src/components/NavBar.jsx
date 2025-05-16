import * as React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
} from "@mui/material/";
import MenuIcon from "@mui/icons-material/Menu";
import logo from "../assets/SEIU.png";

export default function NavBar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogOutClick = () => {
    setUser(
      // Reset user state and navigate to login page
      { userName: null, isAuthenticated: false }
    );
    navigate("/login");
  };

  return (
    <AppBar sx={{ position: "fixed" }}>
      <Toolbar>
        <img
          alt="SEIU Logo"
          src={logo}
          style={{ height: "3em", marginRight: "2.5em" }}
        />
        <Typography
          component="div"
          sx={{
            font: "helvetica; arial; sans-serif",
            fontStyle: "italic",
            fontWeight: "bold",
            letterSpacing: "0.02em",
            fontSize: "1.6em",
            flexGrow: 1,
          }}
        >
          ContractBot
        </Typography>
        {user.isAuthenticated && (
          <Button color="inherit" onClick={handleLogOutClick}>
            Log out
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
