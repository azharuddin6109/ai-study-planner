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
type ModalActionType = "delete" | "signout" | null;
type MessageType = "success" | "error" | "info" | "";

type StudyPlan = {
  intro: string;
  priorities: string[];
  tips: string[];
  subjects: string[];
  warning?: string;
};

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
  const [messageType, setMessageType] = useState<MessageType>("");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ModalActionType>(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [aiPlan, setAiPlan] = useState<StudyPlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

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

  const showMessage = (text: string, type: MessageType) => {
    setMessage(text);
    setMessageType(type);
  };

  const cleanText = (value: string) => {
    return value.replace(/\s+/g, " ").trim();
  };

  const formatSubjectName = (value: string) => {
    const cleaned = cleanText(value);

    if (!cleaned) return "";

    const smallWords = new Set(["and", "or", "of", "the", "in", "on", "for", "to"]);

    return cleaned
      .toLowerCase()
      .split(" ")
      .map((word, index) => {
        if (index > 0 && smallWords.has(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  const cleanTaskTitle = (value: string) => {
    return cleanText(value);
  };

  const fetchTasks = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      showMessage("Error loading tasks: " + error.message, "error");
    } else {
      const cleanedTasks =
        data?.map((task) => ({
          ...task,
          title: cleanTaskTitle(task.title),
          subject: formatSubjectName(task.subject),
        })) || [];

      setTasks(cleanedTasks);
      setAiPlan(null);
      setCopySuccess("");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    const cleanedTitle = cleanTaskTitle(title);
    const cleanedSubject = formatSubjectName(subject);

    if (!cleanedTitle || !cleanedSubject || !deadline || !userId) {
      showMessage("Please fill in all fields.", "error");
      return;
    }

    const { error } = await supabase.from("tasks").insert([
      {
        user_id: userId,
        title: cleanedTitle,
        subject: cleanedSubject,
        deadline,
        completed: false,
      },
    ]);

    if (error) {
      showMessage("Error adding task: " + error.message, "error");
    } else {
      setTitle("");
      setSubject("");
      setDeadline("");
      await fetchTasks(userId);
      showMessage("Task added successfully.", "success");
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    if (!userId) return;

    setMessage("");
    setMessageType("");

    const { error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    if (error) {
      showMessage("Error updating task: " + error.message, "error");
    } else {
      await fetchTasks(userId);
      showMessage(
        task.completed ? "Task marked as pending again." : "Task completed successfully.",
        "success"
      );
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditSubject(task.subject);
    setEditDeadline(task.deadline);
    setMessage("");
    setMessageType("");
  };

  const saveEdit = async () => {
    if (!userId || !editingTaskId) {
      showMessage("Something went wrong while editing.", "error");
      return;
    }

    const cleanedTitle = cleanTaskTitle(editTitle);
    const cleanedSubject = formatSubjectName(editSubject);

    if (!cleanedTitle || !cleanedSubject || !editDeadline) {
      showMessage("Please fill in all edit fields.", "error");
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title: cleanedTitle,
        subject: cleanedSubject,
        deadline: editDeadline,
      })
      .eq("id", editingTaskId);

    if (error) {
      showMessage("Error saving task: " + error.message, "error");
    } else {
      setEditingTaskId(null);
      setEditTitle("");
      setEditSubject("");
      setEditDeadline("");
      await fetchTasks(userId);
      showMessage("Task updated successfully.", "success");
    }
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditSubject("");
    setEditDeadline("");
    setMessage("");
    setMessageType("");
  };

  const openDeleteModal = (taskId: string) => {
    setTaskToDeleteId(taskId);
    setModalAction("delete");
    setIsModalOpen(true);
  };

  const openSignOutModal = () => {
    setModalAction("signout");
    setTaskToDeleteId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (modalLoading) return;
    setIsModalOpen(false);
    setModalAction(null);
    setTaskToDeleteId(null);
  };

  const confirmModalAction = async () => {
    if (!userId || !modalAction) return;

    setModalLoading(true);
    setMessage("");
    setMessageType("");

    if (modalAction === "delete") {
      if (!taskToDeleteId) {
        setModalLoading(false);
        closeModal();
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDeleteId);

      if (error) {
        showMessage("Error deleting task: " + error.message, "error");
      } else {
        await fetchTasks(userId);
        showMessage("Task deleted successfully.", "success");
      }
    }

    if (modalAction === "signout") {
      await supabase.auth.signOut();
      router.push("/login");
      return;
    }

    setModalLoading(false);
    closeModal();
  };

  const getDueStatus = (dateString: string) => {
    const today = new Date();
    const taskDate = new Date(dateString);

    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);

    const diffMs = taskDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: "Overdue",
        description: `overdue by ${Math.abs(diffDays)} day(s)`,
        className: "bg-red-500/10 text-red-300",
      };
    }

    if (diffDays === 0) {
      return {
        label: "Due Today",
        description: "due today",
        className: "bg-red-500/10 text-red-200",
      };
    }

    if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        description: "due tomorrow",
        className: "bg-amber-500/10 text-amber-200",
      };
    }

    if (diffDays <= 7) {
      return {
        label: "Due Soon",
        description: `due in ${diffDays} days`,
        className: "bg-yellow-500/10 text-yellow-200",
      };
    }

    return {
      label: "Upcoming",
      description: `due on ${dateString}`,
      className: "bg-blue-500/10 text-blue-200",
    };
  };

  const formatDateLabel = (dateString: string) => {
    return getDueStatus(dateString).description;
  };

  const handleGeneratePlan = async () => {
    if (tasks.length === 0) {
      setAiPlan({
        intro: "Add a few tasks first, then generate your study plan.",
        priorities: [],
        tips: [],
        subjects: [],
      });
      setCopySuccess("");
      showMessage("Add some tasks to make your study plan more useful.", "info");
      return;
    }

    setAiLoading(true);
    setCopySuccess("");

    const pendingTasks = tasks.filter((task) => !task.completed);

    if (pendingTasks.length === 0) {
      setTimeout(() => {
        setAiPlan({
          intro: "Nice work. You have completed all your current tasks.",
          priorities: [],
          tips: [
            "Review your hardest subjects while your workload is lighter.",
            "Prepare notes for upcoming classes or quizzes.",
            "Add your next study goals so you stay ahead.",
          ],
          subjects: [],
        });
        setAiLoading(false);
        showMessage("Study plan refreshed successfully.", "success");
      }, 600);
      return;
    }

    const sortedTasks = [...pendingTasks].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const priorities = sortedTasks.map((task, index) => {
      const prefix = index === 0 ? "Start with" : "Then work on";
      return `${prefix} "${task.title}" for ${task.subject} because it is ${formatDateLabel(
        task.deadline
      )}.`;
    });

    const uniqueSubjects = [
      ...new Set(
        sortedTasks
          .map((task) => formatSubjectName(task.subject))
          .filter((subjectName) => subjectName.length > 1)
      ),
    ];

    const tips = [
      "Work in 25 to 45 minute focused sessions.",
      "Finish the most urgent task before switching if possible.",
      "Take a short break between study sessions.",
      "Review completed work at the end of the day.",
    ];

    const hasOverdueTask = sortedTasks.some((task) => {
      const today = new Date();
      const taskDate = new Date(task.deadline);
      today.setHours(0, 0, 0, 0);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today;
    });

    setTimeout(() => {
      setAiPlan({
        intro: "Here is your suggested study plan.",
        priorities,
        tips,
        subjects: uniqueSubjects,
        warning: hasOverdueTask
          ? "You also have overdue work, so try to clear that before spending time on later tasks."
          : undefined,
      });
      setAiLoading(false);
      showMessage("Study plan generated successfully.", "success");
    }, 700);
  };

  const handleCopyPlan = async () => {
    if (!aiPlan) return;

    const lines: string[] = [];
    lines.push(aiPlan.intro);

    if (aiPlan.priorities.length > 0) {
      lines.push("");
      lines.push("Priority Order:");
      aiPlan.priorities.forEach((item, index) => {
        lines.push(`${index + 1}. ${item}`);
      });
    }

    if (aiPlan.tips.length > 0) {
      lines.push("");
      lines.push("Suggested Approach:");
      aiPlan.tips.forEach((tip) => {
        lines.push(`- ${tip}`);
      });
    }

    if (aiPlan.subjects.length > 0) {
      lines.push("");
      lines.push(`Subjects to Balance: ${aiPlan.subjects.join(", ")}`);
    }

    if (aiPlan.warning) {
      lines.push("");
      lines.push(`Attention Needed: ${aiPlan.warning}`);
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopySuccess("Study plan copied successfully.");
      showMessage("Study plan copied successfully.", "success");
      setTimeout(() => {
        setCopySuccess("");
      }, 2500);
    } catch {
      setCopySuccess("Could not copy the study plan.");
      showMessage("Could not copy the study plan.", "error");
      setTimeout(() => {
        setCopySuccess("");
      }, 2500);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.filter((task) => !task.completed).length;

  const messageStyles =
    messageType === "success"
      ? {
          wrapper: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
          badge: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20",
          badgeText: "Success",
        }
      : messageType === "error"
      ? {
          wrapper: "border-red-400/20 bg-red-500/10 text-red-100",
          badge: "bg-red-500/15 text-red-200 border border-red-400/20",
          badgeText: "Error",
        }
      : {
          wrapper: "border-blue-400/20 bg-blue-500/10 text-blue-100",
          badge: "bg-blue-500/15 text-blue-200 border border-blue-400/20",
          badgeText: "Info",
        };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-8 py-6 text-lg text-slate-200 shadow-2xl shadow-black/30 backdrop-blur-xl">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[-60px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-60px] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200 backdrop-blur-md">
              AI Study Planner Dashboard
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Stay organized and keep moving forward
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Manage your study tasks, sort what matters most, and keep your academic workflow clean and focused.
            </p>
          </div>

          <button
            onClick={openSignOutModal}
            className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
          >
            Sign Out
          </button>
        </div>

        {message && (
          <div
            className={`mb-8 rounded-2xl border px-5 py-4 shadow-lg backdrop-blur-md ${messageStyles.wrapper}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${messageStyles.badge}`}>
                  {messageStyles.badgeText}
                </div>
                <p className="text-sm font-medium">{message}</p>
              </div>

              <button
                onClick={() => {
                  setMessage("");
                  setMessageType("");
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm font-medium text-blue-200">Total Tasks</p>
            <p className="mt-4 text-4xl font-bold text-white">{tasks.length}</p>
            <p className="mt-2 text-sm text-slate-400">All tasks in your study workspace</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm font-medium text-emerald-300">Completed</p>
            <p className="mt-4 text-4xl font-bold text-white">{completedCount}</p>
            <p className="mt-2 text-sm text-slate-400">Tasks you have already finished</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm font-medium text-amber-300">Pending</p>
            <p className="mt-4 text-4xl font-bold text-white">{pendingCount}</p>
            <p className="mt-2 text-sm text-slate-400">Tasks still waiting for attention</p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-200">
                AI Study Plan
              </p>
              <h2 className="text-2xl font-bold text-white">Generate your study plan</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Use your current tasks to create a suggested study order based on pending work and upcoming deadlines.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {aiPlan && (
                <button
                  onClick={handleCopyPlan}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Copy Study Plan
                </button>
              )}

              <button
                onClick={handleGeneratePlan}
                disabled={aiLoading}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {aiLoading ? "Generating Plan..." : "Generate Plan"}
              </button>
            </div>
          </div>

          {copySuccess && (
            <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
              {copySuccess}
            </div>
          )}

          {!aiPlan ? (
            <div className="rounded-2xl border border-blue-400/10 bg-blue-500/5 p-5 backdrop-blur-md">
              <p className="text-lg font-medium text-white">Your AI plan will appear here</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Click Generate Plan to create a suggested study plan from your current task list.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5 backdrop-blur-md">
                <p className="text-lg font-semibold text-white">{aiPlan.intro}</p>
              </div>

              {aiPlan.priorities.length > 0 && (
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/8 p-5 backdrop-blur-md">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-sm font-bold text-blue-200">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Priority Order</h3>
                      <p className="text-sm text-blue-100/70">
                        Start with the most urgent tasks first.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {aiPlan.priorities.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-blue-400/10 bg-slate-800/60 p-4"
                      >
                        <p className="text-sm font-medium text-slate-100">
                          <span className="mr-2 font-semibold text-blue-300">{index + 1}.</span>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiPlan.tips.length > 0 && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/8 p-5 backdrop-blur-md">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">Suggested Approach</h3>
                    <p className="text-sm text-emerald-100/70">
                      A cleaner way to work through your study sessions.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {aiPlan.tips.map((tip, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-emerald-400/10 bg-slate-800/60 p-4"
                      >
                        <p className="text-sm text-slate-100">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiPlan.subjects.length > 0 && (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/8 p-5 backdrop-blur-md">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">Subjects to Balance</h3>
                    <p className="text-sm text-violet-100/70">
                      Keep these subjects in mind while planning your study sessions.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {aiPlan.subjects.map((subjectName, index) => (
                      <span
                        key={index}
                        className="rounded-full border border-violet-400/25 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-100"
                      >
                        {subjectName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiPlan.warning && (
                <div className="rounded-2xl border border-amber-400/25 bg-amber-500/12 p-5">
                  <h3 className="text-lg font-semibold text-amber-200">Attention Needed</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-100">
                    {aiPlan.warning}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-8 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-200">
                Add Task
              </p>
              <h2 className="text-2xl font-bold text-white">Create a new study task</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add a title, subject, and deadline to keep your study plan organized.
              </p>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500"
              >
                Add Task
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-200">
                  Task List
                </p>
                <h2 className="text-2xl font-bold text-white">Your study tasks</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilter("completed")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === "completed"
                      ? "bg-emerald-600 text-white"
                      : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  Completed
                </button>

                <button
                  onClick={() => setFilter("pending")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === "pending"
                      ? "bg-amber-500 text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center">
                <p className="text-lg font-medium text-white">No tasks found</p>
                <p className="mt-2 text-sm text-slate-400">
                  Try another filter or add a new task to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const dueStatus = getDueStatus(task.deadline);

                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
                    >
                      {editingTaskId === task.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">
                              Task Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/30"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/30"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">
                              Deadline
                            </label>
                            <input
                              type="date"
                              value={editDeadline}
                              onChange={(e) => setEditDeadline(e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-white outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/30"
                            />
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={saveEdit}
                              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500"
                            >
                              Save Changes
                            </button>

                            <button
                              onClick={cancelEdit}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center gap-3">
                              <h3
                                className={`text-xl font-semibold ${
                                  task.completed ? "text-slate-400 line-through" : "text-white"
                                }`}
                              >
                                {task.title}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  task.completed
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : "bg-amber-500/10 text-amber-300"
                                }`}
                              >
                                {task.completed ? "Completed" : "Pending"}
                              </span>

                              {!task.completed && (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${dueStatus.className}`}
                                >
                                  {dueStatus.label}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-slate-300">
                              Subject: <span className="text-slate-200">{task.subject}</span>
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              Deadline: {task.deadline}
                              {!task.completed && (
                                <span className="ml-2 text-slate-300">
                                  ({dueStatus.description})
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              onClick={() => toggleTaskComplete(task)}
                              className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                            >
                              {task.completed ? "Undo" : "Complete"}
                            </button>

                            <button
                              onClick={() => startEditing(task)}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => openDeleteModal(task.id)}
                              className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">
              Confirmation
            </div>

            <h3 className="text-2xl font-bold text-white">
              {modalAction === "delete" ? "Delete this task?" : "Sign out now?"}
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {modalAction === "delete"
                ? "This action will permanently remove the selected task from your study planner."
                : "You will be signed out of your account and redirected to the login page."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={closeModal}
                disabled={modalLoading}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={confirmModalAction}
                disabled={modalLoading}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  modalAction === "delete"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                }`}
              >
                {modalLoading
                  ? "Please wait..."
                  : modalAction === "delete"
                  ? "Yes, Delete Task"
                  : "Yes, Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}