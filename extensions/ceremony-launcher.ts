// ABOUTME: Launches ava-shell Next.js ceremony UI as a local web server from pi-mono sessions.
// ABOUTME: Registers /ceremony command with start|stop|status subcommands; cleans up on session shutdown.

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

const AVA_SHELL_DIR = "/home/ava/workspace/ava-shell";
const CEREMONY_PORT = 3960;
const CEREMONY_URL = `http://localhost:${CEREMONY_PORT}`;

let ceremonyProcess: ChildProcess | null = null;
let processReady = false;

function killCeremonyProcess(): boolean {
	if (!ceremonyProcess) return false;
	try {
		ceremonyProcess.kill("SIGTERM");
	} catch {
		// already dead
	}
	ceremonyProcess = null;
	processReady = false;
	return true;
}

export default function ceremonyLauncher(pi: ExtensionAPI) {
	pi.registerCommand("ceremony", {
		description:
			"Launch or manage the Sacred Trading Ceremony UI — /ceremony [start|stop|status]",
		handler: async (args, ctx) => {
			const subcommand = (args ?? "").trim().toLowerCase().split(/\s+/)[0] || "start";

			switch (subcommand) {
				case "start":
				case "launch":
					return handleStart(ctx, pi);

				case "stop":
				case "kill":
					return handleStop(ctx);

				case "status":
					return handleStatus(ctx);

				case "help":
					ctx.ui.notify(
						[
							"🌀 /ceremony — Sacred Trading Ceremony UI",
							"",
							"Commands:",
							"  /ceremony            Start the ceremony web UI",
							"  /ceremony start      Same as above",
							"  /ceremony stop       Stop the running server",
							"  /ceremony status     Show current status",
							"",
							"Routes:",
							`  ${CEREMONY_URL}/              Medicine Wheel & Four Faces`,
							`  ${CEREMONY_URL}/state-graph   FDB Breakout state graph`,
							`  ${CEREMONY_URL}/ceremony      Ceremony dashboard`,
						].join("\n"),
						"info",
					);
					return;

				default:
					ctx.ui.notify(
						`Unknown subcommand: ${subcommand}. Use /ceremony help for usage.`,
						"warning",
					);
					return;
			}
		},
	});

	// Clean up child process when session ends
	pi.on("session_shutdown", async () => {
		if (ceremonyProcess) {
			killCeremonyProcess();
		}
	});
}

// ── Handlers ─────────────────────────────────────────────────────

function handleStart(ctx: any, pi: ExtensionAPI) {
	if (ceremonyProcess) {
		ctx.ui.notify(
			`🌀 Ceremony UI already running at ${CEREMONY_URL}`,
			"info",
		);
		return;
	}

	if (!existsSync(AVA_SHELL_DIR)) {
		ctx.ui.notify(
			`❌ ava-shell directory not found: ${AVA_SHELL_DIR}`,
			"error",
		);
		return;
	}

	ctx.ui.notify("🌀 Starting Ceremony UI...", "info");

	ceremonyProcess = spawn(
		"npx",
		["next", "dev", "-p", String(CEREMONY_PORT)],
		{
			cwd: AVA_SHELL_DIR,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				ANALYSIS_API_URL: process.env.ANALYSIS_API_URL || "http://localhost:8085",
			},
		},
	);

	processReady = false;

	ceremonyProcess.stdout?.setEncoding("utf-8");
	ceremonyProcess.stderr?.setEncoding("utf-8");

	// Detect when Next.js is ready
	const onData = (chunk: string) => {
		if (!processReady && chunk.includes("Ready")) {
			processReady = true;
			ctx.ui.notify(
				`🌀 Ceremony UI ready at ${CEREMONY_URL}`,
				"success",
			);
		}
	};

	ceremonyProcess.stdout?.on("data", onData);
	ceremonyProcess.stderr?.on("data", onData);

	ceremonyProcess.on("error", (err: Error) => {
		ctx.ui.notify(`❌ Ceremony UI failed to start: ${err.message}`, "error");
		ceremonyProcess = null;
		processReady = false;
	});

	ceremonyProcess.on("exit", (code: number | null) => {
		if (ceremonyProcess) {
			// Unexpected exit
			ctx.ui.notify(
				`⚪ Ceremony UI exited (code ${code ?? "unknown"})`,
				"warning",
			);
			ceremonyProcess = null;
			processReady = false;
		}
	});

	// Notify with URL immediately (Next.js takes a moment to compile)
	pi.sendMessage(
		{
			customType: "ceremony-launcher",
			content: [
				`🌀 Ceremony UI starting at ${CEREMONY_URL}`,
				"",
				"Available pages:",
				`  ${CEREMONY_URL}/              — Medicine Wheel & Four Faces`,
				`  ${CEREMONY_URL}/state-graph   — FDB Breakout state graph`,
				`  ${CEREMONY_URL}/ceremony      — Ceremony dashboard`,
			].join("\n"),
			display: true,
		},
		{ deliverAs: "followUp", triggerTurn: false },
	);
}

function handleStop(ctx: any) {
	if (killCeremonyProcess()) {
		ctx.ui.notify("🌀 Ceremony UI stopped", "info");
	} else {
		ctx.ui.notify("⚪ Ceremony UI is not running", "info");
	}
}

function handleStatus(ctx: any) {
	if (ceremonyProcess) {
		const state = processReady ? "ready" : "starting";
		ctx.ui.notify(
			`🌀 Ceremony UI ${state} at ${CEREMONY_URL} (pid: ${ceremonyProcess.pid})`,
			"info",
		);
	} else {
		ctx.ui.notify("⚪ Ceremony UI is not running", "info");
	}
}
