import React, { useState } from "react";
import {
  Box,
  TextField,
  Container,
  Alert,
  Button,
  Typography,
} from "@mui/material/";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { createAuthenicateUserParams } from "../../authentication/authentication";
import api from "../../api/api";

export default function Login() {
  const [errorMessage, setErrorMessage] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (data) => {
    const params = await createAuthenicateUserParams(
      data.username,
      data.password
    );
    const url = `/login?${params}`;

    try {
      const res = await api.get(url);
      if (res.status === 200) {
        console.log("good user!");
        setUser({ userName: data.username, isAuthenticated: true });
        navigate("/");
      } else {
        setErrorMessage("Invalid credentials");
      }
    } catch (error) {
      setErrorMessage("Something went wrong");
      console.error("Something went wrong: ", error);
    }
  };

  return (
    <>
      <Container
        sx={{
          padding: "100px",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Typography variant="h5" sx={{ marginBottom: "25px" }}>
          Meet ContractBot, an AI chatbot to aid SEIU negotiators
        </Typography>
        <Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="username"
              fullWidth
              variant="outlined"
              sx={{ display: "block", width: "300px", marginBottom: "10px" }}
              {...register("username", { required: "Username is required" })}
              error={!!errors.username}
            />
            <TextField
              label="password"
              variant="outlined"
              type="password"
              fullWidth
              sx={{ display: "block", width: "300px", marginBottom: "10px" }}
              {...register("password", { required: "Password is required" })}
              error={!!errors.password}
            />
            <Button type="submit" variant="contained">
              Login
            </Button>
          </form>
        </Box>
      </Container>
    </>
  );
}
