import { useEffect, useState } from "react";
import { fetchPosts, deletePost } from "../Services/Api";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPosts = async () => {
      const data = await fetchPosts();
      setPosts(data);
    };
    loadPosts();
  }, []);

  const handleEdit = (post) => {
    navigate("/", { state: { post } });
  };

  const handleDelete = async (id) => {
    await deletePost(id);
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom textAlign="center">
        All Blogs
      </Typography>
      {posts.map((post) => (
        <Card
          key={post.id}
          sx={{
            backgroundColor: "#f9f9f9",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {post.title}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
          <div style={{ display: "flex", gap: "10px", padding: "0 16px 16px" }}>
            <Button
              variant="contained"
              style={{ background: "#FF7F7F" }}
              onClick={() => handleDelete(post.id)}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              style={{ background: "#7C83BC" }}
              onClick={() => handleEdit(post)}
            >
              Edit
            </Button>
          </div>
        </Card>
      ))}
    </Container>
  );
};

export default BlogPage;
