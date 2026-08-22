"""
Background Telegram Polling Daemon for BizPilot AI
Continuously processes incoming Telegram messages, commands, and approval callbacks in real time.
"""

import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.connectors.telegram_service import telegram_service

def run_poller():
    telegram_service.reload_config()
    print("BizPilot AI Telegram Polling Daemon Running (Checking every 1.5s)...")
    while True:
        try:
            updates = telegram_service.poll_updates_once()
            if updates:
                print(f"Processed {len(updates)} Telegram update(s).")
        except Exception as e:
            print(f"Poller error: {e}")
        time.sleep(1.5)

if __name__ == "__main__":
    run_poller()
