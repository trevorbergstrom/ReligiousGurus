# Technical Implementation Plan

## 1. CopilotKit Integration

### Frontend Changes

```tsx
// App.tsx - Wrap the application with CopilotProvider
import { CopilotProvider, CopilotPopover } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

function App() {
  return (
    <CopilotProvider 
      apiUrl="/api/copilot"
      // Pass our Religious Gurus context
      contextItems={[
        { name: "worldviews", text: "The available worldviews include: Atheism, Agnosticism, Christianity, Islam, Hinduism, Buddhism, Judaism, Sikhism" }
      ]}
    >
      <Router />
      <CopilotPopover 
        defaultOpen={false}
        prePrompt="I'm your Religious Gurus assistant. I can help you explore different worldviews and spiritual perspectives."
      />
    </CopilotProvider>
  );
}
```

### Backend Implementation

```typescript
// server/routes.ts - Add Copilot API endpoint
app.post("/api/copilot", async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    // Extract the current worldview context if available
    const currentWorldviews = context?.filter(item => item.name === "current_worldviews")?.[0]?.text;
    
    // Create a prompt that leverages our existing worldview experts
    const prompt = `As a Religious Gurus assistant, help the user with their question. 
    ${currentWorldviews ? `Consider these worldviews: ${currentWorldviews}` : ""}`;
    
    // Use our existing ChatAgent system but adapt for Copilot's format
    const response = await generateCopilotResponse(messages, prompt);
    
    res.json({ response });
  } catch (error) {
    console.error("Copilot API error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});
```

## 2. GMI Cloud Integration

### Authentication System

```typescript
// shared/schema.ts - Add user schema
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
});

// Update existing schemas to include user reference
export const topics = pgTable("topics", {
  // ...existing fields
  userId: text("user_id").references(() => users.id),
});

export const chatSessions = pgTable("chat_sessions", {
  // ...existing fields
  userId: text("user_id").references(() => users.id),
});
```

### Sync Service Implementation

```typescript
// server/syncService.ts
export class GMICloudSyncService {
  async syncUserData(userId: string) {
    try {
      // Get all user's data
      const userData = await this.collectUserData(userId);
      
      // Send to GMI Cloud
      const syncResult = await this.sendToGMICloud(userId, userData);
      
      // Update last synced timestamp
      await db.update(users)
        .set({ lastSyncedAt: new Date() })
        .where(eq(users.id, userId));
        
      return syncResult;
    } catch (error) {
      console.error("Sync error:", error);
      throw new Error("Failed to sync with GMI Cloud");
    }
  }
  
  private async collectUserData(userId: string) {
    // Collect user's topics, chat sessions, and messages
    const userTopics = await db.select().from(topics).where(eq(topics.userId, userId));
    const userSessions = await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
    // ...collect other data
    
    return {
      topics: userTopics,
      chatSessions: userSessions,
      // ...other data
    };
  }
  
  private async sendToGMICloud(userId: string, data: any) {
    // Implementation would depend on GMI Cloud's API
    // This is a placeholder for the actual implementation
    const response = await fetch("https://api.gmicloud.com/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GMI_CLOUD_API_KEY}`
      },
      body: JSON.stringify({
        userId,
        data
      })
    });
    
    if (!response.ok) {
      throw new Error("GMI Cloud sync failed");
    }
    
    return await response.json();
  }
}
```

## 3. AgentR Integration

### Agent Architecture Refactoring

```typescript
// server/agents/agentR.ts
import { AgentR, MemoryManager, KnowledgeBase } from "agentr";

export class ReligiousExpertAgentR {
  private agent: AgentR;
  private worldview: WorldView;
  private memory: MemoryManager;
  private knowledgeBase: KnowledgeBase;
  
  constructor(worldview: WorldView) {
    this.worldview = worldview;
    
    // Initialize AgentR components
    this.memory = new MemoryManager({
      capacity: 10, // Number of conversation turns to remember
      decayRate: 0.2 // How quickly to forget older information
    });
    
    this.knowledgeBase = new KnowledgeBase({
      sources: [
        { name: `${worldview}-core-beliefs`, content: this.getWorldviewCoreBeliefs() },
        { name: `${worldview}-practices`, content: this.getWorldviewPractices() },
        { name: `${worldview}-history`, content: this.getWorldviewHistory() }
      ]
    });
    
    // Create the agent with AgentR
    this.agent = new AgentR({
      name: `${worldview} Expert`,
      role: `You are an expert on ${getWorldViewName(worldview)}. Provide accurate, neutral information about this worldview.`,
      memory: this.memory,
      knowledgeBase: this.knowledgeBase,
      model: process.env.OPENAI_MODEL || "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async getResponse(question: string, context?: string): Promise<string> {
    // Create a proper context for the agent
    const fullContext = context 
      ? `${context}\n\nQuestion: ${question}` 
      : `Question: ${question}`;
      
    // Get response from AgentR
    const response = await this.agent.run(fullContext);
    
    // Update agent memory with the interaction
    this.memory.add({
      role: "user",
      content: question
    });
    
    this.memory.add({
      role: "assistant",
      content: response
    });
    
    return response;
  }
  
  private getWorldviewCoreBeliefs(): string {
    // Return core beliefs based on worldview
    switch(this.worldview) {
      case WorldView.CHRISTIANITY:
        return "Christianity core beliefs include...";
      // Add other worldviews
      default:
        return "";
    }
  }
  
  // Similar methods for practices and history
  private getWorldviewPractices(): string {
    // Implementation
  }
  
  private getWorldviewHistory(): string {
    // Implementation
  }
}
```

### Worldview Group Coordinator with AgentR

```typescript
// server/agents/groupCoordinator.ts
import { AgentR, AgentGroup, MemoryManager } from "agentr";

export class WorldviewGroupCoordinator {
  private coordinator: AgentR;
  private experts: Map<WorldView, ReligiousExpertAgentR>;
  private group: AgentGroup;
  private groupMemory: MemoryManager;
  
  constructor() {
    // Initialize experts
    this.experts = new Map();
    Object.values(WorldView).forEach(worldview => {
      this.experts.set(worldview, new ReligiousExpertAgentR(worldview));
    });
    
    // Create group memory
    this.groupMemory = new MemoryManager({
      capacity: 20,
      decayRate: 0.1
    });
    
    // Create coordinator agent
    this.coordinator = new AgentR({
      name: "Worldview Coordinator",
      role: "You coordinate conversations between different worldview experts. Your job is to ensure a balanced, educational discussion that fairly represents each perspective.",
      memory: this.groupMemory,
      model: process.env.OPENAI_MODEL || "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Create agent group
    this.group = new AgentGroup({
      agents: [this.coordinator, ...this.experts.values()],
      coordinator: this.coordinator,
      roundRobinTurns: false // Allow coordinator to decide who speaks
    });
  }
  
  async processGroupChat(
    question: string, 
    worldviews: WorldView[]
  ): Promise<Record<WorldView, string>> {
    // Filter to just the requested worldviews
    const selectedExperts = worldviews.map(wv => this.experts.get(wv)).filter(Boolean);
    
    // Create temporary group with just the selected experts
    const chatGroup = new AgentGroup({
      agents: [this.coordinator, ...selectedExperts],
      coordinator: this.coordinator,
      roundRobinTurns: true // Each expert takes a turn in this case
    });
    
    // Run the group chat
    const responses = await chatGroup.discuss({
      topic: question,
      turns: worldviews.length, // One turn per worldview
      summarize: false // We want individual responses, not a summary
    });
    
    // Format the results
    const result: Record<WorldView, string> = {};
    
    responses.forEach((response, index) => {
      if (index > 0) { // Skip coordinator (index 0)
        const worldview = worldviews[index - 1];
        result[worldview] = response.content;
      }
    });
    
    return result;
  }
}
```

## Integration Challenges and Considerations

1. **API Key Management**: We'll need secure storage and access to:
   - OpenAI API key (for our existing functionality)
   - GMI Cloud API key and credentials
   - Any additional keys required by AgentR

2. **Database Migrations**:
   - Adding user tables and relationships
   - Updating existing schemas for GMI Cloud compatibility
   - Adding fields to support AgentR's state management

3. **Performance Optimization**:
   - AgentR's multi-agent system may require more resources
   - Implementing efficient synchronization with GMI Cloud
   - Optimizing CopilotKit to minimize latency

4. **User Experience Considerations**:
   - Seamless login and data synchronization
   - Intuitive interface for CopilotKit assistance
   - Clear indication of which expert is responding in group chats

5. **Testing Requirements**:
   - Unit tests for each integration
   - Integration tests across the full system
   - User acceptance testing for new features