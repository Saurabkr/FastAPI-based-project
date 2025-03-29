import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import WritePage from "./Components/WritePage";
import BlogPage from "./Components/BlogPage";
import Register from "./Components/Register";
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import { Link } from "react-router-dom";
import Login from "./Components/Login";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation(); // ✅ Moved inside Router

  return (
    <AppBar position="static" elevation={1} sx={{ bgcolor: "#9873AC" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          Learn&Note
        </Typography>
        {user ? (
          <>
            <Button color="inherit" component={Link} to="/">
              Write
            </Button>
            <Button color="inherit" component={Link} to="/blogs">
              Blogs
            </Button>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </>
        ) : location.pathname === "/register" ? (
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
        ) : (
          <Button color="inherit" component={Link} to="/register">
            Register
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Container>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              useContext(AuthContext).user ? (
                <WritePage />
              ) : (
                <Navigate replace to="/login" />
              )
            }
          />
          <Route path="/blogs" element={<BlogPage />} />
          <Route
            path="*"
            element={
              useContext(AuthContext).user ? (
                <Navigate replace to="/" />
              ) : (
                <Navigate replace to="/login" />
              )
            }
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
