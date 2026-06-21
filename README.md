# Quiz Multiplayer 🎮

Um sistema de Quiz Web multiplayer em tempo real, focado em uma experiência rápida, responsiva e minimalista. O projeto permite que um host crie uma sala, importe perguntas geradas por Inteligência Artificial e jogue com até 10 participantes simultaneamente.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído dividindo as responsabilidades entre uma interface de alta performance e um servidor baseado em eventos:

**Frontend:**
* [React.js](https://reactjs.org/) (com Vite para build ultrarrápido)
* [Tailwind CSS](https://tailwindcss.com/) (estilização com foco em Dark Mode minimalista)
* [Socket.io-client](https://socket.io/) (comunicação em tempo real)

**Backend:**
* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [Socket.io](https://socket.io/) (gerenciamento de salas e broadcast de eventos)

## ✨ Funcionalidades

* **Salas em Tempo Real:** Criação de salas via código gerado aleatoriamente (ex: `A1B2C3`).
* **Limite de Jogadores:** Suporte para até 10 jogadores simultâneos por sala.
* **Sincronização de Estado:** Atualização ao vivo de quem já respondeu (Tag "RESPONDIDO") sem necessidade de *refresh*.
* **Segurança Anti-Trapaça:** O frontend recebe apenas as alternativas; a validação da resposta correta ocorre estritamente no backend.
* **Importação Inteligente:** Sistema preparado para receber blocos de texto brutos gerados por IAs (ChatGPT/Gemini) e convertê-los automaticamente em rodadas jogáveis.
* **Migração de Host:** Se o host atual cair ou sair da sala, o controle da partida é automaticamente transferido para o próximo jogador.

## 🛠️ Como Rodar o Projeto Localmente

Siga os passos abaixo para testar o sistema na sua máquina:

### 1. Clonando o repositório
\`\`\`bash
git clone https://github.com/thyagoo-dev/quiz-multiplayer.git
cd quiz-multiplayer
\`\`\`

### 2. Rodando o Backend
Abra um terminal e execute:
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
O servidor iniciará na porta `3001`.

### 3. Rodando o Frontend
Abra um segundo terminal e execute:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
O Vite iniciará o frontend, geralmente na porta `5173`. Acesse `http://localhost:5173` no seu navegador.

## 📝 Formato de Importação de Perguntas (Prompt IA)

Para criar as salas, peça para qualquer IA gerar perguntas estritamente neste formato de texto:

\`\`\`text
PERGUNTA: Qual a principal função do Node.js?
A) Criar interfaces gráficas
B) Executar JavaScript no lado do servidor
C) Estilizar páginas web
D) Criar bancos de dados relacionais
CORRETA: B
---
PERGUNTA: O que faz o Tailwind CSS?
A) É um framework de utilitários CSS
B) É uma biblioteca de roteamento
C) É um banco de dados NoSQL
D) É um compilador TypeScript
CORRETA: A
\`\`\`

---
*Desenvolvido por Cícero Thyago | TH16 Technologies*