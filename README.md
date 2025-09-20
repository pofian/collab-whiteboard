# Collaborative Drawing Board

A **real-time collaborative drawing board** with features such as customizable pen color and size, optional background, undo/redo and public chat.

This project can be accesed at https://collab-whiteboard-eight.vercel.app/

## Features

* 🖌 **Drawing Tools**

  * Adjustable pen size
  * Select pen color
  * Undo/Redo functionality
* 🖼 **Background Options**

  * White, black, grid, or checkerboard
* 🌐 **Real-time Collaboration**

  * See online users
  * Public chat with username selection
* 💾 **Save Your Work**

  * Download the canvas as JPEG

## Tech Stack

* **Frontend:** Next.js (React), Tailwind CSS
* **Real-time Communication:** WebSockets

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/pofian/collab-whiteboard.git
   ```
2. Install dependencies:

   ```bash
   cd collab-whiteboard
   npm install
   ```
3. Modify config to run locally:

   ```bash
   code src/context/deploy-config.ts
   ```
  * Set `serverOnline = false`

4. Run the development server:

   ```bash
   npx ts-node ./server.ts
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Choose a username to join the chat.
2. Use the drawing tools to draw on the canvas.
3. Adjust pen color and size as needed.
4. Switch backgrounds from the toolbar.
5. Chat with other users in real-time.
6. Save your drawing as a JPEG using the save button.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for feature requests or bugs.
