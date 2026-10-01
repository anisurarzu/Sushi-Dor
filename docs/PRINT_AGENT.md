# Epson TM-m30III — auto print on paid orders

When Stripe marks an order **PAID**, the app creates a `PrintJob`. A small **local agent** on the restaurant LAN polls the API and sends the ticket to the Epson printer.

## Architecture

```
Stripe webhook → order PAID → PrintJob (PENDING)
                                    ↓
              print-agent.mjs (PC / Raspberry Pi)
                                    ↓
                     Epson TM-m30III (ePOS or TCP 9100)
```

Vercel cannot reach a LAN printer directly — the agent must run in the restaurant.

## 1. Vercel env

```
PRINT_AGENT_SECRET=generate-a-long-random-string
```

Redeploy after adding it.

## 2. Printer (Epson TM-m30III)

1. Connect printer to same Wi‑Fi / Ethernet as the PC.
2. Note the printer IP (Epson TM Utility / router DHCP), e.g. `192.168.1.50`.
3. Prefer a **static IP** (DHCP reservation).
4. Enable **ePOS-Print** (default on TM-m30III).

Test in a browser on the LAN:

`http://192.168.1.50/cgi-bin/epos/service.cgi`

## 3. Run the agent

On a PC or Raspberry Pi that stays online during opening hours:

```bash
cd /path/to/SUHID\'OR

export PRINT_API_URL=https://www.sushidora.fr
export PRINT_AGENT_SECRET=same-as-vercel
export PRINTER_HOST=192.168.1.50
export PRINTER_PORT=80
export PRINTER_PROTOCOL=epos

node scripts/print-agent.mjs
```

### If ePOS fails, try raw ESC/POS

Many TM-m30 accept TCP **9100**:

```bash
export PRINTER_PROTOCOL=escpos
export PRINTER_PORT=9100
node scripts/print-agent.mjs
```

### Keep it running (Linux / Raspberry Pi)

```bash
# systemd example — adjust paths/user
sudo tee /etc/systemd/system/sushi-print-agent.service >/dev/null <<'EOF'
[Unit]
Description=Sushi D'or Epson print agent
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/pi/sushi-dor
Environment=PRINT_API_URL=https://www.sushidora.fr
Environment=PRINT_AGENT_SECRET=CHANGE_ME
Environment=PRINTER_HOST=192.168.1.50
Environment=PRINTER_PORT=80
Environment=PRINTER_PROTOCOL=epos
ExecStart=/usr/bin/node scripts/print-agent.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now sushi-print-agent
```

## 4. Manual reprint

Admin → Commande → **Réimprimer le ticket** (paid orders only).

## 5. Troubleshooting

| Symptom | Check |
|--------|--------|
| Agent `401` | `PRINT_AGENT_SECRET` mismatch Vercel vs agent |
| Agent `503` | Secret not set on Vercel |
| ePOS timeout | Firewall / wrong IP / printer offline |
| Double tickets | Only one agent should run |
| No ticket after pay | Stripe webhook OK? Check `PrintJob` in DB / agent logs |
