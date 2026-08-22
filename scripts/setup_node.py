import os
import sys
import urllib.request
import zipfile
import shutil

NODE_VERSION = "v20.18.0"
NODE_DIR_NAME = f"node-{NODE_VERSION}-win-x64"
ZIP_URL = f"https://nodejs.org/dist/{NODE_VERSION}/{NODE_DIR_NAME}.zip"
TARGET_DIR = os.path.join(os.path.expanduser("~"), ".node")
ZIP_PATH = os.path.join(os.path.expanduser("~"), "node_dist.zip")

print(f"[*] Setting up Node.js {NODE_VERSION}...")

node_exe = os.path.join(TARGET_DIR, "node.exe")
if os.path.exists(node_exe):
    print(f"[+] Node.js already exists at {TARGET_DIR}")
    sys.exit(0)

print(f"[*] Downloading {ZIP_URL}...")
urllib.request.urlretrieve(ZIP_URL, ZIP_PATH)
print("[+] Download complete. Extracting...")

with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
    zip_ref.extractall(os.path.expanduser("~"))

extracted_folder = os.path.join(os.path.expanduser("~"), NODE_DIR_NAME)
if os.path.exists(TARGET_DIR):
    shutil.rmtree(TARGET_DIR)

os.rename(extracted_folder, TARGET_DIR)
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

print(f"[+] Node.js setup successfully at {TARGET_DIR}!")
