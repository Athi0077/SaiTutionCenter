import base64
import os

# Base64 encoded 1x1 transparent PNG
# We'll use this as a placeholder to ensure the files exist and are valid PNGs.
png_base64 = b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
png_data = base64.b64decode(png_base64)

paths = [
    r'e:\code\Projects\HomeWork\frontend\public\pwa-192x192.png',
    r'e:\code\Projects\HomeWork\frontend\public\pwa-512x512.png'
]

for path in paths:
    with open(path, 'wb') as f:
        f.write(png_data)
    print(f"Created {path}")
