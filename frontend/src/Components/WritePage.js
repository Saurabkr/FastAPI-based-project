import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AuthContext } from "../AuthContext";
import { createPost, updatePost } from "../Services/Api";
import { useContext } from "react";
import { useLocation, Navigate } from "react-router-dom";
import "../App.css";
// import { Button, Container, TextField, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import axios from "axios";

const WritePage = () => {
  const location = useLocation();
  const existingPost = location.state?.post;
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const editor = useEditor({ extensions: [StarterKit], content: "" });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      editor?.commands.setContent(existingPost.content);
    }
  }, [existingPost, editor]);

  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleAICheck = async () => {
    if (!title || !editor.getText()) {
      alert("Please enter both title and content.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/check-ai", {
        title,
        content: editor.getText(),
      });
      setAiSuggestions(response.data);
      setOpenModal(true);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    }
    setLoading(false);
  };

  const applyCorrections = () => {
    if (aiSuggestions) {
      setTitle(aiSuggestions.title);
      editor.commands.setContent(aiSuggestions.content);
      setOpenModal(false);
    }
  };

  const handlePublish = async () => {
    if (!editor || !title) return;
    const content = editor.getHTML();
    if (existingPost) {
      await updatePost(existingPost.id, { title, content });
    } else {
      await createPost({ title, content });
    }
    setTitle("");
    editor.commands.clearContent();
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <TextField
        label="Title"
        fullWidth
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: 20 }}
      />
      <EditorContent
        editor={editor}
        className="tiptap"
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "200px",
          outline: "none",
        }}
      />
      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handlePublish}
          sx={{ mt: 2 }}
        >
          Publish
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleAICheck}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "AI Check"}
        </Button>
      </div>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>AI Suggestions</DialogTitle>
        <DialogContent
          dividers
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          <p>
            <strong>Title:</strong> {aiSuggestions?.title}
          </p>
          <div>
            <strong>Content:</strong>
            <div dangerouslySetInnerHTML={{ __html: aiSuggestions?.content }} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={applyCorrections} color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default WritePage;
