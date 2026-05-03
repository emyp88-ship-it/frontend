import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import toast, { Toaster } from "react-hot-toast";

export default function App() {
  const { publicKey } = useWallet();

  const [task, setTask] = useState("");
  const [date, setDate] = useState("");
  const [tasks, setTasks] = useState([]);

  const API = https://backend-fwbm.onrender.com;

  // SW
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("SW OK"));
    }
  }, []);

  // LOAD
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

  // ADD
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

  // 🔔 BASE64 → Uint8
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

  // 🔔 SUBSCRIBE (FIX DEFINITIVO)
  async function subscribeUser() {
    try {
      if (!publicKey) {
        return toast.error("Connetti wallet");
      }

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
    <div style={{ padding: 20 }}>
      <Toaster />

      <h2>Web3 Todo</h2>

      <WalletMultiButton />

      <button onClick={subscribeUser}>
        🔔 Attiva notifiche
      </button>

      <button onClick={sendNotification}>
        🚀 Test push
      </button>

      {publicKey && (
        <>
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="task"
          />

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button onClick={addTask}>ADD</button>
        </>
      )}

      {tasks.map((t) => (
        <div key={t.id}>
          {t.task}
          {t.date && (
            <div>
              {new Date(t.date).toLocaleString()}
            </div>
          )}
          <button onClick={() => deleteTask(t.id)}>
            ❌
          </button>
        </div>
      ))}
    </div>
  );
}
