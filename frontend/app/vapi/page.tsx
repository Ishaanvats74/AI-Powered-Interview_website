"use client";
import Vapi from "@vapi-ai/web";
import { useRef, useState } from "react";

type Message = {
  role: string;
  text: string;
};

export default function Page() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const vapiRef = useRef<Vapi>(null);

  if (vapiRef.current == null) {
    vapiRef.current = new Vapi("57e231a9-93f0-41b4-a7a9-bff2bf3c49d0");
  }

  const handleClick = async () => {
    if (!vapiRef.current) return;
    vapiRef.current.start("97b6b036-19a2-4484-b414-e3ed10d9cfb1");
    try {
      vapiRef.current.on("speech-start", () => {
        console.log("Speech has started");
      });

      vapiRef.current.on("speech-end", () => {
        console.log("Speech has ended");
      });

      vapiRef.current.on("call-start", () => {
        console.log("Call has started");
      });

      vapiRef.current.on("call-end", () => {
        console.log("Call has stopped");
      });

      vapiRef.current.on("message", (message) => {
        if (
          message.type === "transcript" &&
          message.transcriptType === "final"
        ) {
          setConversation((prev) => [
            ...prev,
            {
              role: message.role,
              text: message.transcript,
            },
          ]);
        }
      });
    } catch (error) {
      vapiRef.current.on("error", (e) => {
        console.error(e);
      });
      console.log(error);
    }
  };

  const handleStop = async () => {
    if (!vapiRef.current) return;

    try {
      await vapiRef.current.stop();
      console.log("Call Stopped");
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div>
      <button onClick={handleClick}>Start</button>
      <button onClick={handleStop}>Stop</button>
      {conversation.map((msg, index) => (
        <div key={index} className="border p-3 rounded mb-2 text-white">
          <strong>{msg.role}:</strong>
          <p>{msg.text}</p>
        </div>
      ))}
    </div>
  );
}
