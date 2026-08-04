import sys
import os
from image_upscaling_api import UpscalerAPI

# Generate a consistent 32-char hex client_id
CLIENT_ID = "d8c841bfbef1d26acaddcf2aca1bc0f4"

def enhance_image(input_path, output_path=None):
    if not os.path.exists(input_path):
        print(f"Error: File {input_path} not found.", file=sys.stderr)
        return None

    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_enhanced.png"

    try:
        api = UpscalerAPI(client_id=CLIENT_ID)
        # Upload with plus model, scale=2, face_enhance=True
        img_id = api.upload(input_path, model="plus", scale=2, face_enhance=True)
        api.wait_and_download(img_id, save_path=output_path)
        return output_path
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 enhance_image.py <input_path> [-o <output_path>]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = None

    if len(sys.argv) >= 4 and sys.argv[2] == "-o":
        output_path = sys.argv[3]

    result = enhance_image(input_path, output_path)
    if result:
        print(result)
        sys.exit(0)
    else:
        sys.exit(1)
