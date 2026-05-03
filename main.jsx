import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";

import {
  WalletModalProvider
} from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

// ⚡ NON IMPORTARE PhantomWalletAdapter

const endpoint = "https://api.devnet.solana.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={[]} autoConnect={false}>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);