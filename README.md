# AI Companion — Personal Chatbot Hub

A high-performance, modern AI companion web application built with **React 18**, **TypeScript**, **Vite**, and **OpenRouter**. Designed for engaging interactive conversations, dynamic mood tracking, long-term memory summarization, and responsive desktop/mobile UX.

---

## 🌟 Key Features

- **🎭 Rich Character Personas:** Fully customizable character cards with system prompts, scenarios, greetings, avatar/background styling, and emotional depth.
- **⚡ Multiple Model Support:** Powered by OpenRouter — seamlessly switch between DeepSeek V3, Claude 3.5 Sonnet, Llama 3.3, and more.
- **🧠 Dynamic Mood & Emotional Momentum:** Characters have real emotional inertia (playful, tired, annoyed, vulnerable, etc.) that shifts based on context, time of day, and interactions.
- **📝 Automatic Memory Summarization:** Long conversations are automatically summarized in the background to preserve long-term context without blowing token budgets.
- **🔄 Multi-Swipe Message Generation:** Reroll assistant responses and swipe between alternative replies at any point in the conversation.
- **🎨 Custom Chat Backgrounds & Glassmorphism UI:** Modern dark theme with customizable background images, opacity sliders, and blur controls.
- **🛡️ Cloud & Local Hybrid Storage:** Full Supabase database integration for sync across devices, with instant offline localStorage fallback.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- An [OpenRouter API Key](https://openrouter.ai/)
- (Optional) A [Supabase](https://supabase.com/) project for cloud sync

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/countdestro/chatbotV1.git
   cd chatbotV1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## ⚙️ Configuration

Open the **Settings** modal in the top navigation bar to configure:

- **OpenRouter API Key:** Enter your OpenRouter key to enable AI responses.
- **Supabase URL & Anon Key (Optional):** Connect your Supabase project using the included `supabase_schema.sql` to sync characters and chat histories across devices.
- **Default Model:** Choose your preferred LLM provider and model.
- **Sampling & Penalties:** Fine-tune temperature, top-p, frequency penalty, and presence penalty.

---

## 🗄️ Database Setup (Supabase)

To enable persistent cloud storage, run the SQL queries in `supabase_schema.sql` in your Supabase SQL Editor. This sets up:
- `personas` table for character cards
- `chats` table for conversation sessions
- `messages` table with support for branching and swipe options

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Custom Vanilla CSS with CSS variables, responsive mobile-first layouts
- **Icons:** Lucide React
- **Backend / Database:** Supabase (PostgreSQL + RLS)
- **AI Routing:** OpenRouter API (Streaming SSE completions)

---

## 📄 License

MIT License. Free for personal and educational use.
