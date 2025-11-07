# Enterprise Agentic Platform

A sophisticated multi-agent AI platform built with React that orchestrates multiple specialized AI agents to handle complex queries. The platform uses a planner/orchestrator pattern to break down complex tasks into steps and execute them using specialized agents.

## 🚀 Features

### Multi-Agent Architecture
- **Planner Agent**: Analyzes user queries and creates step-by-step execution plans
- **Knowledge Agent**: Searches through uploaded documents using semantic search
- **Web Search Agent**: Simulates web search for real-time information
- **Code Generation Agent**: Generates code snippets in various programming languages
- **Summarization Agent**: Summarizes text or documents
- **Image Analysis Agent**: Analyzes uploaded images using vision capabilities

### Document Processing
- **File Upload Support**: PDF, DOCX, XLSX, TXT, and image files (PNG, JPG, WEBP)
- **Client-Side Embeddings**: Uses Transformers.js for local document embedding generation
- **Semantic Search**: Vector-based similarity search through uploaded documents
- **Chunking**: Intelligent text chunking with overlap for better context retrieval

### User Interface
- **Modern Chat Interface**: Clean, responsive chat UI with message history
- **Dark Mode**: Toggle between light and dark themes
- **File Management**: Sidebar for managing uploaded files
- **Real-time Status**: Visual indicators for agent processing and document indexing
- **Code Highlighting**: Syntax-highlighted code blocks with copy functionality
- **Source Attribution**: Shows document sources for knowledge-based answers

## 🛠️ Technology Stack

- **Frontend**: React 19.1.1
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Models**:
  - Google Gemini 2.5 Flash (via API) for text generation
  - Transformers.js (Xenova/all-MiniLM-L6-v2) for client-side embeddings
- **File Processing**:
  - PDF.js for PDF parsing
  - Mammoth.js for DOCX parsing
  - XLSX.js for Excel parsing

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```
   
   Replace `your_api_key_here` with your actual Google Gemini API key.

4. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Basic Workflow

1. **Upload Documents**: Click the upload area in the sidebar to add PDF, DOCX, XLSX, or text files. The system will automatically process and index them.

2. **Ask Questions**: Type your question in the chat input. The planner will create an execution plan and route it to the appropriate agents.

3. **Attach Images**: Upload images to analyze them with the Image Analysis Agent.

4. **View Sources**: When the Knowledge Agent retrieves information, source citations are shown below the response.

### Example Queries

- "Summarize the uploaded document about project management"
- "What are the key points in my PDF about machine learning?"
- "Generate a Python function to sort a list of dictionaries by a specific key"
- "Search for the latest trends in AI development"
- "Analyze this image and describe what you see"

## 🏗️ Project Structure

```
my-ai-app/
├── public/          # Static assets
├── src/
│   ├── App.js      # Main application component with all agent logic
│   ├── App.css     # Component styles
│   ├── index.js    # React entry point
│   └── index.css   # Global styles with Tailwind
├── .env            # Environment variables (not in git)
├── .gitignore      # Git ignore rules
├── package.json    # Dependencies and scripts
└── README.md       # This file
```

## 🔐 Security Notes

- **API Key**: Never commit your `.env` file to version control. The `.gitignore` file is configured to exclude it.
- **Client-Side Processing**: Document embeddings are generated client-side for privacy, but API calls to Gemini are made from the browser.

## 🚀 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🧪 Testing

```bash
npm test
```

## 📝 Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## 🎯 How It Works

1. **User Input**: User submits a query or uploads files
2. **Planning Phase**: The Planner Agent analyzes the query and conversation history, then creates a JSON plan with steps
3. **Execution Phase**: Each step is executed by the appropriate specialized agent
4. **Response Assembly**: Results from each step are combined and presented to the user
5. **Document Search**: For knowledge queries, the system uses semantic similarity to find relevant document chunks

## 🔄 Agent Orchestration Flow

```
User Query
    ↓
Planner Agent (creates execution plan)
    ↓
Execute Steps Sequentially
    ↓
[KnowledgeAgent] → [WebSearchAgent] → [CodeGenerationAgent] → etc.
    ↓
Combine Results
    ↓
Display to User
```

## 🐛 Troubleshooting

### App won't start
- Ensure Node.js is installed: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### API errors
- Verify your `.env` file exists and contains a valid API key
- Check that the API key has proper permissions
- Ensure you have internet connectivity

### Document processing fails
- Check browser console for errors
- Ensure files are in supported formats
- Try smaller files if processing times out

### Styling issues
- Ensure Tailwind CSS is properly configured
- Clear browser cache and restart dev server

## 📄 License

This project is private and proprietary.

## 👤 Author

Your Name

## 🙏 Acknowledgments

- Google Gemini API for text generation
- Transformers.js for client-side AI
- React team for the excellent framework
- All open-source contributors of the libraries used

---

**Note**: This is an enterprise-grade multi-agent platform. For production use, consider adding:
- Backend API for secure API key management
- User authentication
- Rate limiting
- Error logging and monitoring
- Database for conversation history
