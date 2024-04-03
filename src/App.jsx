import { useState, useEffect } from "react";
import OpenAI from "openai";
import "./App.css";

const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

const ASSISTANT_ID = "asst_rMjbGewlLbNwMeFo1iW2eNjX";

function App() {
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thread, setThread] = useState(null);

  useEffect(() => {
    const sendInitialMessage = async () => {
      setIsLoading(true);

      try {
        const newThread = await openai.beta.threads.create();
        setThread(newThread);

        const message = await openai.beta.threads.messages.create(
          newThread.id,
          {
            role: "user",
            content: "hello",
          }
        );

        let run = await openai.beta.threads.runs.create(newThread.id, {
          assistant_id: ASSISTANT_ID,
        });

        while (["queued", "in_progress", "cancelling"].includes(run.status)) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          run = await openai.beta.threads.runs.retrieve(run.thread_id, run.id);
        }

        if (run.status === "completed") {
          const messages = await openai.beta.threads.messages.list(
            run.thread_id
          );
          const assistantResponse = messages.data.find(
            (msg) => msg.role === "assistant"
          );
          setResponse(assistantResponse.content[0].text.value);
        } else {
          setResponse(`Error: ${run.status}`);
        }
      } catch (error) {
        console.error("Error:", error);
        setResponse("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    sendInitialMessage();
  }, []);

  async function handleUserInput() {
    setIsLoading(true);
    setResponse("");

    try {
      if (!thread) {
        throw new Error("Thread not initialized");
      }

      const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userInput,
      });

      let run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
      });

      while (["queued", "in_progress", "cancelling"].includes(run.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await openai.beta.threads.runs.retrieve(run.thread_id, run.id);
      }

      if (run.status === "completed") {
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        const assistantResponse = messages.data.find(
          (msg) => msg.role === "assistant"
        );
        setResponse(assistantResponse.content[0].text.value);
      } else {
        setResponse(`Error: ${run.status}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setResponse("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  }

  return (
    <div className="container">
      <div className="input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message here..."
        />
        <button onClick={handleUserInput} disabled={isLoading}>
          {isLoading ? "Loading..." : "Send"}
        </button>
      </div>
      {isLoading && (
        <p className="loading-message">Processing your request...</p>
      )}
      {response && <div className="response-container">{response}</div>}
    </div>
  );
}

export default App;
