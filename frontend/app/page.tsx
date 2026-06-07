'use client'
import Vapi from "@vapi-ai/web";

export default function Home() {
  const vapi = new Vapi('57e231a9-93f0-41b4-a7a9-bff2bf3c49d0');
  const handleClick = ()=>{
    vapi.start('97b6b036-19a2-4484-b414-e3ed10d9cfb1');
    vapi.on('speech-start', () => {
  console.log('Speech has started');
});

vapi.on('speech-end', () => {
  console.log('Speech has ended');
});

vapi.on('call-start', () => {
  console.log('Call has started');
});

vapi.on('call-end', () => {
  console.log('Call has stopped');
});

// Function calls and transcripts will be sent via messages
vapi.on('message', (message) => {
  console.log(message);
});

vapi.on('error', (e) => {
  console.error(e);
});
  }
  const handleStop = ()=>{
    vapi.stop()
  }
  return (
   <div>
    <button onClick={handleClick}>Start</button>
    <button onClick={handleStop}>Stop</button>
   </div>
  );
}
