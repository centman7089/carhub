// @ts-nocheck
import { useState } from "react";
import axios from "axios";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleLocalUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/users/local", formData);
      setMessage("Upload successful: " + res.data.file.cloudinaryUrl);
    } catch (err) {
      setMessage("Upload failed");
    }
  };

  const handleUrlUpload = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/users/from-url", {
        fileUrl: url,
      });
      setMessage("Upload successful: " + res.data.file.cloudinaryUrl);
    } catch (err) {
      setMessage("Upload failed");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-3">Upload your resume</h2>

      <div className="border border-dashed border-gray-400 p-4 text-center mb-4">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.png"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleLocalUpload}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          Upload File
        </button>
      </div>

      <div className="text-center mb-2 text-gray-500">OR</div>

      <input
        type="text"
        placeholder="https://drive.google.com/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <div className="flex justify-end space-x-2 mb-4">
        <button
          onClick={() => setUrl("")}
          className="px-3 py-1 bg-gray-200 text-sm rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleUrlUpload}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
        >
          Upload
        </button>
      </div>

      <button
        className="w-full bg-blue-500 text-white py-2 rounded"
        onClick={() => setMessage("")}
      >
        Done
      </button>

      {message && (
        <p className="text-center mt-4 text-green-600 text-sm">{message}</p>
      )}
    </div>
  );
}
