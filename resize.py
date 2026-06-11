import os
from PIL import Image

images = [
  "DSC05568.JPG", "DSC05571.JPG", "DSC05598.JPG",
  "DSC05616.JPG", "DSC05624.JPG", "DSC05641.JPG",
  "DSC05644.JPG", "DSC05654.JPG", "DSC05659.JPG",
  "DSC05692.JPG", "DSC05699.JPG", "DSC05763.JPG",
  "DSC05791.JPG", "DSC05806.JPG", "DSC05809.JPG"
]

base_dir = r"c:\Users\walte\OneDrive\Escritorio - copia\Escritorio\webstunt\webstunt\public\sponsors\SPORNS"

for img_name in images:
    path = os.path.join(base_dir, img_name)
    opt_path = os.path.join(base_dir, "opt_" + img_name)
    if os.path.exists(path):
        try:
            with Image.open(path) as img:
                # Resize to max 1920 width while maintaining aspect ratio
                max_width = 1920
                if img.width > max_width:
                    ratio = max_width / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save as optimized JPEG
                img.save(opt_path, "JPEG", quality=80, optimize=True)
                print(f"Optimized {img_name}")
        except Exception as e:
            print(f"Error optimizing {img_name}: {e}")
