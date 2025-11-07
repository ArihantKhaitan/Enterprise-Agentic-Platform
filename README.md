# Enterprise Agentic Platform

A sophisticated multi-agent AI assistant built with React that leverages Google's Gemini AI to provide intelligent document processing, web search, code generation, image analysis, and summarization capabilities.

## 🌟 Features

### Multi-Agent Architecture
- **Planner Agent**: Analyzes user requests and creates step-by-step execution plans
- **Knowledge Agent**: Searches through uploaded documents using semantic similarity
- **Web Search Agent**: Provides real-time information and web-based answers
- **Code Generation Agent**: Generates code snippets in various programming languages
- **Image Analysis Agent**: Analyzes and describes uploaded images
- **Summarization Agent**: Creates concise summaries of documents or text

### Document Processing
- Upload and process multiple file formats:
  - **PDF** - Full text extraction
  - **DOCX** - Microsoft Word documents
  - **XLSX** - Excel spreadsheets
  - **TXT** - Plain text files
  - **Images** - PNG, JPG, JPEG, WEBP
- Client-side document embedding using Transformers.js
- Semantic search through document chunks
- Source attribution for knowledge-based responses

### User Interface
- Modern, responsive design with dark mode support
- Real-time chat interface with agent indicators
- File management sidebar with drag-and-drop support
- Visual plan execution with step-by-step progress
- Code block syntax highlighting with copy functionality
- Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArihantKhaitan/Enterprise-Agentic-Platform.git
   cd Enterprise-Agentic-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   If you encounter npm installation errors, try:
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Or on Windows
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🛠️ Technology Stack

- **Frontend Framework**: React 19
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Model**: Google Gemini 2.5 Flash
- **Embeddings**: Transformers.js (Xenova/all-MiniLM-L6-v2)
- **Document Processing**: 
  - PDF.js for PDF parsing
  - Mammoth.js for DOCX parsing
  - XLSX.js for Excel parsing

## 📖 Usage

### Basic Workflow

1. **Upload Documents**: Click the upload area or drag and drop files to build your knowledge base
2. **Ask Questions**: Type your question in the chat input
3. **View Execution Plan**: The planner creates a step-by-step plan
4. **Watch Agents Work**: See each agent execute its part of the plan
5. **Get Results**: Receive comprehensive answers with source citations

### Example Queries

- **Knowledge Base**: "What are the key points in the uploaded document?"
- **Code Generation**: "Generate a Python function to calculate fibonacci numbers"
- **Web Search**: "What are the latest trends in AI?"
- **Image Analysis**: Upload an image and ask "What do you see in this image?"
- **Summarization**: "Summarize the uploaded document"

### Multi-Step Queries

The platform excels at complex, multi-step queries:
- "Search for recent AI breakthroughs and then generate Python code to implement a neural network"
- "Analyze the uploaded document, summarize it, and then create a code example based on its concepts"

## 🔧 Configuration

### API Key

The application requires a Google Gemini API key. You can set it in two ways:

1. **Environment Variable** (Recommended): Add to `.env` file
2. **Hardcoded Fallback**: The app includes a fallback key (not recommended for production)

⚠️ **Security Note**: Never commit your API key to version control. Use environment variables for production deployments.

### Customizing Agents

You can modify agent behavior by editing the agent handler functions in `src/App.js`:
- `handleKnowledgeQuery()` - Knowledge base search
- `handleWebSearchQuery()` - Web search simulation
- `handleCodeGenerationQuery()` - Code generation
- `handleImageAnalysisQuery()` - Image analysis
- `handleSummarizationQuery()` - Text summarization

## 🏗️ Project Structure

```
enterprise-agentic-platform/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Component styles
│   ├── index.js        # Entry point
│   ├── index.css       # Global styles with Tailwind
│   └── ...
├── .env.example        # Environment variables template
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## 🧪 Testing

```bash
npm test
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👤 Author

**Arihant Khaitan**

- GitHub: [@ArihantKhaitan](https://github.com/ArihantKhaitan)

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Transformers.js for client-side ML
- React team for the amazing framework
- All open-source contributors

## 📄 Additional Notes

- The client-side embedding model is loaded on first use (may take a few seconds)
- Document processing happens entirely in the browser (privacy-friendly)
- Large documents are automatically chunked for efficient processing
- The app uses semantic similarity search for finding relevant document sections

---

**Made with ❤️ using React and Gemini AI**
