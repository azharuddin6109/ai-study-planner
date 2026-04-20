import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tasks = body.tasks;

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Tasks are required." },
        { status: 400 }
      );
    }

    const pendingTasks = tasks.filter((task: any) => !task.completed);

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        plan: "You have no pending tasks right now. Review difficult topics, prepare ahead for upcoming classes, or add new study goals.",
      });
    }

    const taskText = pendingTasks
      .map(
        (task: any, index: number) =>
          `${index + 1}. Title: ${task.title}, Subject: ${task.subject}, Deadline: ${task.deadline}`
      )
      .join("\n");

    const prompt = `
You are a helpful study planning assistant.

A student has these pending tasks:
${taskText}

Create a short, clear study plan.
Rules:
- Put the most urgent tasks first
- Keep the wording simple
- Suggest a realistic order
- Write in a helpful student-friendly tone
- Keep it concise but useful
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const plan =
      response.output_text || "Could not generate a study plan right now.";

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("Generate plan error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          error?.error?.message ||
          "Something went wrong while generating the study plan.",
      },
      { status: 500 }
    );
  }
}