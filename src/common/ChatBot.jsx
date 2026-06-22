// ChatBot.js
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaComments, FaTimes } from 'react-icons/fa';

const getRandomReply = (options) => options[Math.floor(Math.random() * options.length)];

const chatbotResponse = (input) => {
  const message = input.toLowerCase().trim();
  const responses = [
    {
      pattern: /hi|hello|hey/,
      reply: () => getRandomReply([
        "Hi there! How can I assist you at Shanvilla today?",
        "Hello! Looking for something special?",
        "Hey! Welcome to Shanvilla. How can I help?"
      ])
    },
    {
      pattern: /rooms?|accommodation|stay/,
      reply: () => getRandomReply([
        "We offer elegant suites and villas. Visit /rooms to take a look.",
        "Looking for a room? Our luxury accommodations are just a click away: rooms page",
        "Check out our available suites and villas here: rooms page"
      ])
    },
    {
      pattern: /dining|food|restaurant/,
      reply: () => getRandomReply([
        "Hungry? Experience fine dining at our resort. Browse the Gallery: gallery page",
        "Our chefs prepare unforgettable meals. Learn more at gallery page",
        "Explore our dining spaces and cuisine in the Gallery: gallery page"
      ])
    },
    {
      pattern: /activities|things to do|experiences/,
      reply: () => getRandomReply([
        "Looking for adventure? We’ve got exclusive experiences just for you. See gallery page",
        "Explore exciting activities during your stay at Shanvilla. Visit gallery page",
        "From safaris to spa sessions—we've got it all! Check out gallery page"
      ])
    },
    {
      pattern: /garden|outdoor|relax/,
      reply: () => getRandomReply([
        "Our Annah Garden is perfect for unwinding. More info at gallery page",
        "Need a breath of fresh air? Stroll through our outdoor spaces in the Gallery.",
        "Relaxation begins in our garden oasis. Discover more at gallery page"
      ])
    },
    {
      pattern: /contact|reach|phone|email/,
      reply: () => getRandomReply([
        "You can reach us via the Contact page or email reception@shanvillaresortkenya.co.ke",
        "Feel free to contact us at info@shanvilla.ke or visit contact page",
        "Need help? Message us through our Contact page or send an email"
      ])
    },
    {
      pattern: /about|resort|who are you/,
      reply: () => getRandomReply([
        "Shanvilla is a premier luxury resort in Kenya. Read our story at about page",
        "We're Shanvilla — where luxury meets culture and nature. More at about page",
        "Discover Shanvilla's story and vision on the About page: about page"
      ])
    },
    {
      pattern: /bye|goodbye/,
      reply: () => getRandomReply([
        "Goodbye! We hope to see you again soon.",
        "Take care! Shanvilla awaits your next visit.",
        "Farewell! Come back anytime for more serenity."
      ])
    },
    {
      pattern: /.*/,
      reply: () => getRandomReply([
        "Hmm... I didn’t catch that. Try asking about rooms, food, or contact info.",
        "I’m not sure how to help with that. You can ask me about activities or accommodation!",
        "Could you try rephrasing that? I'm here to help with resort info!"
      ])
    }
  ];

  for (let item of responses) {
    if (item.pattern.test(message)) {
      return item.reply();
    }
  }
};

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const ChatContainer = styled.div`
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 300px;
  max-height: 400px;
  background: #FAF5EF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: ${slideUp} 0.3s ease forwards;
`;

const ToggleButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #085f14ff;
  color: white;
  font-size: 24px;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 1001;
`;

const Header = styled.div`
  background: #069dd9ff;
  color: white;
  padding: 12px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  font-weight: bold;
  text-align: center;
`;

const ChatBody = styled.div`
  padding: 10px;
  flex: 1;
  overflow-y: auto;
`;

const ChatMessage = styled.div`
  margin: 8px 0;
  padding: 10px 14px;
  border-radius: 10px;
  max-width: 80%;
  align-self: ${({ sender }) => (sender === 'user' ? 'flex-end' : 'flex-start')};
  background: ${({ sender }) => (sender === 'user' ? '#d97706' : '#f0f0f0')};
  color: ${({ sender }) => (sender === 'user' ? 'white' : '#333')};
  text-align: ${({ sender }) => (sender === 'user' ? 'right' : 'left')};
`;

const InputWrapper = styled.div`
  display: flex;
  border-top: 1px solid #ddd;

  input {
    flex: 1;
    padding: 10px;
    border: none;
    font-size: 14px;
  }

  button {
    background: #1165e2ff;
    color: white;
    border: none;
    padding: 10px 16px;
    cursor: pointer;
  }
`;

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    const botMsg = { sender: 'bot', text: chatbotResponse(input) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <>
      {open && (
        <ChatContainer>
          <Header>Shanvilla Chat</Header>
          <ChatBody>
            {messages.map((msg, index) => (
              <ChatMessage key={index} sender={msg.sender}>
                {msg.text}
              </ChatMessage>
            ))}
          </ChatBody>
          <InputWrapper>
            <input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </InputWrapper>
        </ChatContainer>
      )}
      <ToggleButton onClick={() => setOpen(prev => !prev)}>
        {open ? <FaTimes /> : <FaComments />}
      </ToggleButton>
    </>
  );
};

export default ChatBot;
