# Religious Gurus - Comparative Worldview Explorer

An educational AI application that provides neutral, comparative insights on religious and non-religious worldviews across user-submitted topics.

## 🧭 Purpose

Religious Gurus helps users explore how major worldviews interpret any topic they submit by querying 8 AI agents representing different religious and non-religious belief systems:

- Atheism
- Agnosticism
- Christianity
- Islam
- Hinduism
- Buddhism
- Judaism
- Sikhism

## 🏗️ Features

- Submit topics or questions to explore different worldview interpretations
- Receive a neutral summary comparing the different belief systems
- View data visualizations showing key differences and similarities
- Explore detailed comparisons in a structured format
- Review past topics you've explored
- One-on-one chat with AI agents representing each worldview
- Multi-expert group chats with multiple worldview perspectives simultaneously
- Behind-the-scenes process transparency to understand AI reasoning
- Select from various OpenAI models (GPT-4o, GPT-4, GPT-3.5)
- Educational and neutral presentation of diverse perspectives
- Mobile-friendly, responsive design

## 🖥️ Technical Implementation

The application is built using:

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with Node.js
- **AI Integration**: OpenAI API with GPT models (GPT-4o, GPT-4, GPT-3.5-turbo)
- **Database**: PostgreSQL for persistent storage
- **Data Visualization**: Chart.js for worldview comparison metrics
- **Architecture**: LangGraph for agent orchestration

## 📝 Usage

### Topic Comparisons
1. Enter a topic or question in the text field
2. Select your preferred AI model
3. Click "Get Comparative Insights" to submit
4. Review the AI-generated summary paragraph
5. Explore the chart visualization and detailed comparison table
6. Browse your history to revisit past topics

### Worldview Chat
1. Select a worldview you want to chat with or create a group chat with multiple worldviews
2. For single worldview chats:
   - Click on any worldview button to start a one-on-one conversation
   - Chat directly with an AI agent representing that specific perspective
3. For group chats with multiple perspectives:
   - Click "New Chat" and select the "Group Chat" tab
   - Check the boxes for multiple worldviews you want to include (e.g., Buddhism, Christianity, and Islam)
   - Enter an optional title for your group chat (or a default will be generated)
4. Type your questions into the chat input field
5. Receive distinct responses from each selected worldview perspective in the same conversation
6. Choose your preferred OpenAI model using the compact selector at the bottom
7. Each response is clearly labeled with the corresponding worldview icon and name

## 🧬 System Architecture

The application uses an agentic AI framework with the following components:

1. **Coordinator Agent**: Orchestrates the entire response generation process
2. **Worldview Expert Agents**: Eight specialist agents representing each religious/philosophical perspective
3. **Response Synthesis Engine**: Aggregates insights into coherent summaries
4. **Visualization Generator**: Creates comparative charts based on expert responses
5. **Process Transparency System**: Shows users how information is gathered and processed
6. **Multi-Agent Chat System**: Enables group discussions with multiple worldview experts simultaneously
7. **Parallel Processing Pipeline**: Handles concurrent responses from multiple religious perspectives

## 🔐 API Requirements

This application requires an OpenAI API key to function. The key should be added as an environment variable:
- `OPENAI_API_KEY`: Your API key from OpenAI (required for all AI functionality)

The application uses exclusively OpenAI models for all AI interactions:
- GPT-4o: Recommended for most conversations (default)
- GPT-4: Good for complex reasoning tasks
- GPT-3.5-turbo: Faster response times for simpler queries

## 📱 Mobile Support

The application is fully responsive and supports all device sizes from mobile to desktop, with optimized layouts for each form factor:

- Responsive grid layouts that adapt to screen size
- Mobile-optimized navigation with collapsible sections
- Touch-friendly interface elements for all interactions
- Properly sized text and controls on smaller screens
- Optimized group chat interface for mobile devices

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

All source code files include the appropriate MIT license headers, making it easy for others to understand the licensing terms and contribute to or build upon this project.

## ⚠️ Disclaimer

Information provided by Religious Gurus is AI-generated and intended for educational purposes only. Always consult authoritative sources for theological guidance. The application aims to present comparative information neutrally without promoting any particular worldview.