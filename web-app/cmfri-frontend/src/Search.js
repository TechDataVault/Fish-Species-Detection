import React, { useState, useEffect } from "react";
import "./App.css";
import background from "./assets/dashboard.jpg";
import { useNavigate } from "react-router-dom";

function Search() {
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const navigate = useNavigate();

  // // 🔹 Convert description into bullet points
  // const formatPoints = (text) => {
  //   if (!text) return [];
  //   return text
  //     .split(/\d+\.\s+/)
  //     .filter((point) => point.trim() !== "");
  // };

  // 🔹 Convert description to clean bullet points (NO numbers)
const formatPoints = (text) => {
  if (!text) return [];

  return text
    .split(/\n+/)                 // split by newline
    .map(p => p.trim())           // remove extra spaces
    .filter(p => p !== "")        // remove empty lines
    .map(p => p.replace(/^\d+\.\s*/, "")); // remove "1. "
};


  useEffect(() => {
    if (!query || selectedSpecies?.name === query) {
      setSpecies([]);
      setShowDropdown(false);
      setNotFound(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/species?q=${query}`
        );
        const data = await res.json();

        if (!data.found || data.species.length === 0) {
          setSpecies([]);
          setSelectedSpecies(null);
          setShowDropdown(false);
          setNotFound(true);
        } else {
          setSpecies(data.species);
          setShowDropdown(true);
          setNotFound(false);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [query, selectedSpecies]);

  const handleSelect = (sp) => {
    setSelectedSpecies(sp);
    setQuery(sp.name);
    setSpecies([]);
    setShowDropdown(false);
    setNotFound(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedSpecies(null);
    setSpecies([]);
    setShowDropdown(false);
    setNotFound(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "20px",
        position: "relative",
      }}
    >
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "8px 14px",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#6c757d",
          color: "#fff",
          cursor: "pointer",
          fontSize: "14px",
          zIndex: 10,
        }}
      >
        ← Back
      </button>

      {/* 🔍 Search Section */}
      <div style={{ marginTop: "60px" }}>
        <div style={{ position: "relative", width: "400px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="🔍 Search species..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #fff",
              backgroundColor: "#fff",
              fontSize: "1rem",
            }}
          />

          {query && (
            <span
              onClick={handleClear}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              ×
            </span>
          )}

          {/* Dropdown */}
          {showDropdown && species.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "50px",
                left: 0,
                right: 0,
                background: "#fff",
                borderRadius: "8px",
                listStyle: "none",
                padding: 0,
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1000,
              }}
            >
              {species.map((sp, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(sp)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {sp.name}
                </li>
              ))}
            </ul>
          )}

          {notFound && (
            <div
              style={{
                position: "absolute",
                top: "50px",
                left: 0,
                right: 0,
                backgroundColor: "#000",
                color: "#fff",
                padding: "12px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              Species Not Found
            </div>
          )}
        </div>

        {/* 🐟 Selected Species Display */}
        {selectedSpecies && (
          <div
            style={{
              marginTop: "30px",
              background: "rgba(255,255,255,0.95)",
              padding: "25px",
              borderRadius: "12px",
              maxWidth: "800px",
              margin: "30px auto",
              color: "#000",
              boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <h2>{selectedSpecies.name}</h2>

            {selectedSpecies.image && (
              <img
                src={selectedSpecies.image}
                alt={selectedSpecies.name}
                style={{
                  display: "block",
                  margin: "15px auto",
                  maxWidth: "85%",
                  maxHeight: "250px",
                  borderRadius: "10px",
                }}
              />
            )}

            <strong>Description:</strong>

            <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
              {formatPoints(selectedSpecies.description).map((point, index) => (
                <li key={index} style={{ marginBottom: "6px" }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
