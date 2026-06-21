# TH Quiz Multiplayer 🎮

Um sistema de Quiz Web multiplayer em tempo real, focado em uma experiência rápida, responsiva e minimalista. Permite que um host crie uma sala, importe perguntas e jogue com até 10 participantes simultaneamente.

## 🔗 Acesse o Projeto Online
Você pode testar o sistema em tempo real aqui:
**[Acesse o TH Quiz](https://quiz-multiplayer-chi.vercel.app/)**

*(Certifique-se de abrir o link em duas abas diferentes do navegador para testar o modo multiplayer!)*

## 🚀 Tecnologias Utilizadas

**Frontend:**
* [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Socket.io-client](https://socket.io/)

**Backend:**
* [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
* [Socket.io](https://socket.io/)
* Hospedado em produção no [Render](https://render.com/)

## ✨ Funcionalidades Principais

* **Tempo Real:** Sincronização instantânea de estado entre todos os jogadores.
* **Sistema de Timer:** 20 segundos por pergunta com bônus de pontuação por velocidade de resposta.
* **Gestão de Salas:** Sistema de criação, entrada e migração automática de host caso o criador saia.
* **UI Minimalista:** Design otimizado para mobile e desktop com Dark Mode.

## 🛠️ Como Rodar Localmente (Desenvolvimento)

Se você deseja contribuir ou estudar o código:

### 1. Clonar
\`\`\`bash
git clone https://github.com/thyagoo-dev/quiz-multiplayer.git
cd quiz-multiplayer
\`\`\`

### 2. Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### 3. Frontend
No arquivo `frontend/src/App.jsx`, certifique-se de que o socket está apontando para `http://localhost:3001` durante o desenvolvimento.
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 📝 Como importar perguntas
Peça para uma IA gerar perguntas neste formato e cole na área de criação de sala:

\`\`\`text
PERGUNTA: [Sua pergunta aqui]
A) [Alternativa]
B) [Alternativa]
C) [Alternativa]
D) [Alternativa]
CORRETA: [Letra]
---
\`\`\`

---
*Desenvolvido por Cícero Thyago | Quanthy Technology*