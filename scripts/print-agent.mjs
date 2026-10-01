#!/usr/bin/env node
/**
 * Sushi D'or — local Epson print agent (TM-m30 / TM-m30III)
 *
 * Run on a PC / Raspberry Pi on the same LAN as the printer:
 *   PRINT_API_URL=https://www.sushidora.fr \
 *   PRINT_AGENT_SECRET=your-secret \
 *   PRINTER_HOST=192.168.1.50 \
 *   node scripts/print-agent.mjs
 *
 * Protocols:
 *   PRINTER_PROTOCOL=epos   (default) — Epson ePOS HTTP XML
 *   PRINTER_PROTOCOL=escpos — raw TCP port 9100
 */

import net from "node:net";

const API_URL = (process.env.PRINT_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const SECRET = process.env.PRINT_AGENT_SECRET || "";
const PRINTER_HOST = process.env.PRINTER_HOST || "192.168.1.50";
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 80);
const PROTOCOL = (process.env.PRINTER_PROTOCOL || "epos").toLowerCase();
const DEVICE_ID = process.env.PRINTER_DEVICE_ID || "local_printer";
const POLL_MS = Number(process.env.POLL_MS || 3000);
const RESTAURANT_ID = process.env.RESTAURANT_ID || "";

if (!SECRET) {
  console.error("Missing PRINT_AGENT_SECRET");
  process.exit(1);
}

const headers = {
  "x-print-agent-secret": SECRET,
  "content-type": "application/json",
  accept: "application/json",
};

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function printEpos(xml) {
  const url = `http://${PRINTER_HOST}:${PRINTER_PORT}/cgi-bin/epos/service.cgi?devid=${encodeURIComponent(DEVICE_ID)}&timeout=10000`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "text/xml; charset=utf-8",
      "If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT",
    },
    body: xml,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ePOS HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (/code="(?!0|EPTR_SUCCESS)[^"]+"/i.test(text) && /response/i.test(text)) {
    // Epson returns SOAP; success usually has success="true" or code="0"
    if (!/success="true"/i.test(text) && !/code="0"/i.test(text)) {
      throw new Error(`ePOS printer error: ${text.slice(0, 300)}`);
    }
  }
  return text;
}

function printEscpos(base64) {
  const buf = Buffer.from(base64, "base64");
  const port = Number(process.env.PRINTER_PORT || 9100);
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: PRINTER_HOST, port }, () => {
      socket.write(buf, (err) => {
        if (err) reject(err);
        else {
          socket.end();
          resolve();
        }
      });
    });
    socket.setTimeout(8000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("ESC/POS TCP timeout"));
    });
    socket.on("error", reject);
  });
}

async function handleJob(job) {
  log("claim", job.id, job.order?.orderNumber || job.orderId);
  const claimed = await api(`/api/print/jobs/${job.id}/claim`, {
    method: "POST",
    body: "{}",
  });
  const payload = claimed.job;
  try {
    if (PROTOCOL === "escpos") {
      if (!payload.escposBase64) throw new Error("No escpos payload");
      await printEscpos(payload.escposBase64);
    } else {
      await printEpos(payload.eposXml);
    }
    await api(`/api/print/jobs/${job.id}/complete`, {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    });
    log("printed", job.id);
  } catch (err) {
    const message = err?.message || String(err);
    log("fail", job.id, message);
    await api(`/api/print/jobs/${job.id}/complete`, {
      method: "POST",
      body: JSON.stringify({ ok: false, error: message }),
    }).catch(() => {});
  }
}

async function tick() {
  const qs = new URLSearchParams({ limit: "5" });
  if (RESTAURANT_ID) qs.set("restaurantId", RESTAURANT_ID);
  const { jobs } = await api(`/api/print/jobs?${qs}`);
  if (!jobs?.length) return;
  for (const job of jobs) {
    await handleJob(job);
  }
}

log("agent start", {
  API_URL,
  PRINTER_HOST,
  PRINTER_PORT,
  PROTOCOL,
  POLL_MS,
});

async function loop() {
  for (;;) {
    try {
      await tick();
    } catch (err) {
      log("poll error", err?.message || err);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

loop();
