const { GoogleGenerativeAI } = require("@google/generative-ai");

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Strip HTML tags from content
const stripHTML = (html) => {
  return html.replace(/<[^>]*>/g, '').trim();
};

// 🔹 Generate chunks from plain text
const generateChunks = (text, maxWords = 300) => {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
};

// 🔹 Generate embeddings for an array of chunks
const generateEmbeddings = async (chunks) => {
  const embeddings = [];
  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);
    embeddings.push(embedding);
  }
  return embeddings;
};

// 🔹 Embedding function
const getEmbedding = async (text) => {
  const model = ai.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// 🔹 Chat function
const generateAnswer = async (prompt) => {
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = {
  stripHTML,
  generateChunks,
  generateEmbeddings,
  getEmbedding,
  generateAnswer,
};