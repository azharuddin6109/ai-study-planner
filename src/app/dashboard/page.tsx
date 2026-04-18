"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  deadline: string;
  completed: boolean;
  created_at?: string;
};

type FilterType = "all" | "completed" | "pending";

export default function DashboardPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      await fetchTasks(user.id);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const fetchTasks = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Error loading tasks: " + error.message);
    } else {
      setTasks(data || []);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!title || !subject || !deadline || !userId) {
      setMessage("Please fill in all fields.");
      return;
    }

    const { error } = await supabase.from("tasks").insert([
      {
        user_id: userId,
        title,
        subject,
        deadline,
        completed: false,
      },
    ]);

    if (error) {
      setMessage("Error adding task: " + error.message);
    } else {
      setTitle("");
      setSubject("");
      setDeadline("");
      await fetchTasks(userId);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    if (!userId) return;

    const { error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    if (error) {
      setMessage("Error updating task: " + error.message);
    } else {
      await fetchTasks(userId);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      setMessage("Error deleting task: " + error.message);
    } else {
      await fetchTasks(userId);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditSubject(task.subject);
    setEditDeadline(task.deadline);
  };

  const saveEdit = async () => {
    if (!userId || !editingTaskId || !editTitle || !editSubject || !editDeadline) {
      setMessage("Please fill in all edit fields.");
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title: editTitle,
        subject: editSubject,
        deadline: editDeadline,
      })
      .eq("id", editingTaskId);

    if (error) {
      setMessage("Error saving task: " + error.message);
    } else {
      setEditingTaskId(null);
      setEditTitle("");
      setEditSubject("");
      setEditDeadline("");
      await fetchTasks(userId);
    }
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditSubject("");
    setEditDeadline("");
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (!confirmed) return;

    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-lg">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>

          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Sign Out
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold">Total Tasks</h2>
            <p className="text-3xl mt-4">{tasks.length}</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold">Completed</h2>
            <p className="text-3xl mt-4">
              {tasks.filter((task) => task.completed).length}
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold">Pending</h2>
            <p className="text-3xl mt-4">
              {tasks.filter((task) => !task.completed).length}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>

          <form onSubmit={handleAddTask} className="grid gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none"
            />

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none"
            />

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none"
            />

            <button
              type="submit"
              className="md:col-span-3 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium"
            >
              Add Task
            </button>
          </form>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Your Tasks</h2>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "all"
                    ? "bg-blue-600"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "completed"
                    ? "bg-green-600"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                Completed
              </button>

              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "pending"
                    ? "bg-yellow-600 text-black"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-slate-400">No tasks found for this filter.</p>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700"
                >
                  {editingTaskId === task.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white outline-none"
                      />

                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white outline-none"
                      />

                      <input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white outline-none"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            task.completed ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {task.title}
                        </h3>
                        <p className="text-slate-300">Subject: {task.subject}</p>
                        <p className="text-slate-400">Deadline: {task.deadline}</p>
                        <p className="text-sm mt-2">
                          Status:{" "}
                          <span
                            className={
                              task.completed
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {task.completed ? "Completed" : "Pending"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleTaskComplete(task)}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          {task.completed ? "Undo" : "Complete"}
                        </button>

                        <button
                          onClick={() => startEditing(task)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}