# Gestor de Contraseñas: Secure Local Password Vault

[cloudflarebutton]

Gestor de Contraseñas is a secure, minimalist, local-first password manager that stores your credentials in a robustly encrypted vault directly in your browser's local storage. It's designed with a 'less is more' philosophy, focusing on clarity, usability, and absolute privacy, ensuring no data ever leaves your device.

## ✨ Key Features

-   **100% Local & Private**: All data is stored and encrypted in your browser's local storage. Nothing is ever sent to a server.
-   **Strong Encryption**: Utilizes the Web Crypto API for robust, client-side encryption (PBKDF2 for key derivation and AES-GCM for vault encryption).
-   **Master Password Protection**: A single, strong master password is all you need to secure and access your vault.
-   **Full Credential Management**: Add, view, edit, and delete your login credentials with ease.
-   **Secure Password Generator**: Create strong, unique passwords directly within the app.
-   **Quick Copy & Auto-Clear**: Copy usernames and passwords to the clipboard with a single click. The clipboard is automatically cleared after a short duration for enhanced security.
-   **Minimalist & Responsive UI**: A clean, intuitive, and visually stunning interface that works flawlessly across all devices.
-   **Zero Dependencies**: No reliance on external cloud services, databases, or third-party servers.

## 🚀 Technology Stack

-   **Framework**: React (with Vite)
-   **Styling**: Tailwind CSS & shadcn/ui
-   **State Management**: Zustand
-   **Forms**: React Hook Form & Zod
-   **Icons**: Lucide React
-   **Animation**: Framer Motion
-   **Notifications**: Sonner
-   **Deployment**: Cloudflare Pages & Workers

## 🏁 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Bun](https://bun.sh/) (v1.0 or higher)
-   [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/cipherkeep_local_vault.git
    cd cipherkeep_local_vault
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

3.  **Run the development server:**
    ```sh
    bun run dev
    ```

The application will be available at `http://localhost:3000`.

## 🛠️ Development

The project is structured to separate concerns and maintain a clean codebase.

-   `src/`: Contains all the frontend React application code.
-   `src/pages/`: Main application views (Onboarding, LockScreen, Vault).
-   `src/components/`: Reusable UI components, primarily built with shadcn/ui.
-   `src/lib/`: Core logic, including `crypto.ts` for all cryptographic operations and `utils.ts`.
-   `src/store/`: Zustand stores for global state management.
-   `worker/`: Cloudflare Worker code for serving the static assets.

### Available Scripts

-   `bun run dev`: Starts the local development server.
-   `bun run build`: Builds the application for production.
-   `bun run lint`: Lints the codebase using ESLint.
-   `bun run deploy`: Deploys the application to Cloudflare.

## ☁️ Deployment

This application is optimized for deployment on the Cloudflare network.

### Deploy with a Single Click

[cloudflarebutton]

### Manual Deployment via Wrangler

1.  **Login to Cloudflare:**
    ```sh
    npx wrangler login
    ```

2.  **Build the project:**
    ```sh
    bun run build
    ```

3.  **Deploy to Cloudflare Pages:**
    ```sh
    bun run deploy
    ```

Wrangler will handle the process of uploading your built assets and configuring the project on Cloudflare.

## 🔐 Security Model

Gestor de Contraseñas is built with security as its highest priority.

-   **Client-Side Encryption**: All cryptographic operations happen directly in your browser. Your master password and unencrypted data never leave your device.
-   **In-Memory Decryption**: The vault is only decrypted in the application's memory and is purged as soon as the vault is locked or the tab is closed.
-   **No Telemetry**: The application does not collect any usage data, analytics, or personal information.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.