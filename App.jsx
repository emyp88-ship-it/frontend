import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function App() {
  const { publicKey } = useWallet();

  const [task, setTask] = useState("");
  const [date, setDate] = useState("");
  const [tasks, setTasks] = useState([]);

  const API = https://backend-fwbm.onrender.com;

  // SERVICE WORKER
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("SW OK"));
    }
  }, []);

  // LOAD TASK
  async function loadTasks() {
    if (!publicKey) return;

    const res = await fetch(
      `${API}/tasks/${publicKey.toString()}`
    );
    setTasks(await res.json());
  }

  useEffect(() => {
    loadTasks();
  }, [publicKey]);

  // ADD TASK
  async function addTask() {
    if (!task) return toast.error("Scrivi task");

    await fetch(`${API}/add-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
        wallet: publicKey.toString(),
        date,
      }),
    });

    setTask("");
    setDate("");
    loadTasks();

    toast.success("Task aggiunto");
  }

  // DELETE
  async function deleteTask(id) {
    await fetch(`${API}/delete-task/${id}`, {
      method: "DELETE",
    });

    loadTasks();
    toast("Eliminato");
  }

  // BASE64 FIX (NO BUFFER ERROR)
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    return Uint8Array.from(
      [...rawData].map((c) => c.charCodeAt(0))
    );
  }

  // 🔔 NOTIFICHE
  async function subscribeUser() {
    try {
      if (!publicKey) return toast.error("Connetti wallet");

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        return toast.error("Permesso negato");
      }

      const reg = await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(
              "BBf4IBSj9V6ADfc25vbJlC9su78w_ED6hPeYW4qgL5mqovV9KEQcC8ku1Md2BYRBJBeInGUK3FxRm15s1rfvQ4c"
            ),
        });
      }

      await fetch(`${API}/subscribe`, {
        method: "POST",
        body: JSON.stringify({
          sub,
          wallet: publicKey.toString(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Notifiche attive 🔔");
    } catch (e) {
      console.error(e);
      toast.error("Errore notifiche");
    }
  }

  // TEST PUSH
  async function sendNotification() {
    await fetch(`${API}/notify`, { method: "POST" });
    toast("Push inviato");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #020617, #0f172a)",
        color: "white",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      <Toaster />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>⚡ Web3 Todo</h2>

          {publicKey && (
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {publicKey.toString().slice(0, 4)}...
              {publicKey.toString().slice(-4)}
            </div>
          )}
        </div>

        <WalletMultiButton />
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={subscribeUser}>
          🔔 Notifiche
        </button>
        <button onClick={sendNotification}>
          🚀 Test
        </button>
      </div>

      {/* INPUT */}
      {publicKey && (
        <div
          style={{
            background: "#1e293b",
            padding: 15,
            borderRadius: 16,
            marginTop: 20,
          }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Nuovo task..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
              background: "#0f172a",
              color: "white",
              border: "none",
            }}
          />

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
              background: "#0f172a",
              color: "white",
              border: "none",
            }}
          />

          <button onClick={addTask}>
            ➕ Aggiungi Task
          </button>
        </div>
      )}

      {/* TASK LIST */}
      <div style={{ marginTop: 20 }}>
        {tasks.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#1e293b",
              padding: 15,
              borderRadius: 16,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <b>{t.task}</b>
              {t.date && (
                <div
                  style={{ fontSize: 12, opacity: 0.6 }}
                >
                  ⏰{" "}
                  {new Date(t.date).toLocaleString()}
                </div>
              )}
            </div>

            <button
              onClick={() => deleteTask(t.id)}
            >
              ❌
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}