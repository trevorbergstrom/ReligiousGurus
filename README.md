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
- **AI Integration**: OpenAI API (GPT-4o and other models)
- **Database**: PostgreSQL for persistent storage
- **Data Visualization**: Chart.js
- **API Integration**: OpenAI API

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
3. For group chats with multiple perspectives:
   - Click "New Chat" and select the "Group Chat" tab
   - Select multiple worldviews you want to include in the conversation
   - Enter an optional title for your group chat
4. Enter your questions and receive responses from each selected worldview
5. Choose an OpenAI model for your conversation
6. Continue the conversation in a chat-like interface
7. See different perspectives clearly labeled with worldview icons

## 🧬 System Architecture

The application uses an agentic AI framework:

1. **Coordinator Agent**: Receives user input and coordinates responses
2. **Expert Agents**: Eight specialist agents representing each worldview
3. **Response Synthesis**: Aggregates insights into summaries and visualizations
4. **Transparent Processing**: Shows users how the AI generates its responses
5. **Multi-Agent Conversations**: Enables discussions with multiple expert agents simultaneously
6. **Parallel Processing**: Processes responses from multiple worldviews for group conversations

## 🔐 API Requirements

This application requires an OpenAI API key to function. The key should be added as an environment variable:
- `OPENAI_API_KEY`: Your API key from OpenAI

## 📱 Mobile Support

The application is fully responsive and supports all device sizes from mobile to desktop, with optimized layouts for each form factor.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

Information provided by Religious Gurus is AI-generated and intended for educational purposes only. Always consult authoritative sources for theological guidance. The application aims to present comparative information neutrally without promoting any particular worldview.