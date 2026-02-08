// src/components/CalorieChecker.jsx
import React, { useState } from "react";
import { callAI, fileToBase64, buildScanPrompt, buildEstimatePrompt } from "../utils/api";

export default function CalorieChecker() {
  const [foodName, setFoodName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState("");

  // Handler for text-only calorie estimate
  const handleTextEstimate = async () => {
    if (!foodName.trim()) return;
    try {
      const response = await callAI(buildEstimatePrompt(foodName.trim()));
      setResult(response);
    } catch (err) {
      console.error(err);
      setResult("Error fetching AI response");
    }
  };

  // Handler for image scan calorie estimate
  const handleImageScan = async () => {
    if (!selectedFile) return;
    try {
      const base64 = await fileToBase64(selectedFile);
      const scanResponse = await callAI(buildScanPrompt(base64, selectedFile.type));
      setResult(scanResponse);
    } catch (err) {
      console.error(err);
      setResult("Error scanning image");
    }
  };

  return (
    <div>
      <h2>Food Calorie Checker</h2>

      {/* Text input */}
      <div>
        <input
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="Enter food name"
        />
        <button onClick={handleTextEstimate}>Get Text Estimate</button>
      </div>

      {/* Image input */}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={handleImageScan}>Scan Image</button>
      </div>

      {/* Result */}
      <div>
        <h3>Result:</h3>
        <pre>{result}</pre>
      </div>
    </div>
  );
}
