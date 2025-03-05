import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";

const Button = ({ onClick, children, className }) => (
  <button onClick={onClick} className={`px-3 py-1 rounded-md ${className}`}>
    {children}
  </button>
);

const LetterEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit, Bold, Italic, Strike, BulletList, OrderedList, ListItem],
    content: localStorage.getItem("letter_draft") || "", 
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(localStorage.getItem("letter_draft") || "");
    }
  }, [editor]);

  const handleSaveDraft = async () => {
    if (!editor) return;
  
    const content = editor.getHTML();
    
    const response = await fetch("https://letter-editor.onrender.com/save-letter", {
      method: "POST",
      credentials: "include", // Important for session cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
  
    const data = await response.json();
    alert(data.message);
  
    if (data.googleDriveUrl) {
      alert("Saved to Google Drive: " + data.googleDriveUrl);
    }
  };
  

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow-lg rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Letter Editor</h2>
      <div className="flex gap-2 mb-2">
        <Button onClick={() => editor.chain().focus().toggleBold().run()} className="bg-gray-200">B</Button>
        <Button onClick={() => editor.chain().focus().toggleItalic().run()} className="bg-gray-200">I</Button>
        <Button onClick={() => editor.chain().focus().toggleStrike().run()} className="bg-gray-200">S</Button>
        <Button onClick={() => editor.chain().focus().toggleBulletList().run()} className="bg-gray-200">• List</Button>
        <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} className="bg-gray-200">1. List</Button>
      </div>
      <div className="border p-2 rounded-md">
        <EditorContent editor={editor} />
      </div>
      <div className="flex gap-4 mt-4">
        <Button onClick={handleSaveDraft} className="bg-blue-500 hover:bg-blue-700 text-white">Save to Server</Button>
      </div>
    </div>
  );
};

export default LetterEditor;


