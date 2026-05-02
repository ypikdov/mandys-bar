import os
import time
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

# Seguridad: Habilitar soporte para archivos HEIC/HEIF
register_heif_opener()

# Límites Anti-Abuso Reales
MAX_MB = 15              # Tamaño máximo de archivo antes de procesar
MAX_SIDE = 6000          # Ancho o alto máximo permitido
MAX_PIXELS = 40_000_000  # ~40MP máximo
Image.MAX_IMAGE_PIXELS = None # Deshabilitar para control manual más fino abajo

SUPPORTED = (".jpg", ".jpeg", ".png", ".heic", ".heif")

def log_event(event_type, message):
    """Simulación de escritura en tabla shadow 'image_jobs'"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {event_type.upper()}: {message}\n"
    with open("image_jobs_log.txt", "a", encoding="utf-8") as f:
        f.write(log_entry)
    print(log_entry.strip())

def square_thumb(img: Image.Image, size=400) -> Image.Image:
    """Crea un thumbnail cuadrado tipo cover (recorte centrado)"""
    img = ImageOps.exif_transpose(img)
    w, h = img.size
    m = min(w, h)
    left = (w - m) // 2
    top = (h - m) // 2
    img = img.crop((left, top, left + m, top + m))
    return img.resize((size, size))

def optimize_images(directory, quality=80, thumb_size=400, keep_original=True):
    if not os.path.exists(directory):
        log_event("error", f"Directorio no encontrado: {directory}")
        return 0

    backup_dir = os.path.join(directory, "_originals_backup")
    if keep_original:
        os.makedirs(backup_dir, exist_ok=True)

    count = 0
    for root, _, files in os.walk(directory):
        if "_originals_backup" in root:
            continue

        for file in files:
            lower = file.lower()
            if not lower.endswith(SUPPORTED):
                continue

            input_path = os.path.join(root, file)
            base_name = os.path.splitext(file)[0]
            webp_path = os.path.join(root, f"{base_name}.webp")
            thumb_path = os.path.join(root, f"{base_name}_thumb.webp")

            # 1. Chequeo de tamaño de archivo (Anti-Abuso)
            file_size_mb = os.path.getsize(input_path) / (1024 * 1024)
            if file_size_mb > MAX_MB:
                log_event("rejected", f"Archivo {file} excede {MAX_MB}MB ({file_size_mb:.2f}MB). Saltando.")
                continue

            try:
                with Image.open(input_path) as img:
                    img = ImageOps.exif_transpose(img)
                    w, h = img.size

                    # 2. Chequeo de resolución y dimensiones (Anti-Abuso)
                    if w > MAX_SIDE or h > MAX_SIDE or (w * h) > MAX_PIXELS:
                        log_event("warning", f"Imagen {file} muy grande ({w}x{h}). Redimensionando de forma segura.")
                        img = ImageOps.contain(img, (MAX_SIDE, MAX_SIDE))

                    # Conversión a RGB si no tiene transparencia
                    out = img if img.mode in ("RGBA", "LA") else img.convert("RGB")
                    
                    # Guardar WebP principal
                    out.save(webp_path, "WEBP", quality=quality, method=6)

                    # Guardar Miniatura
                    t = square_thumb(out, size=thumb_size)
                    t.save(thumb_path, "WEBP", quality=max(50, quality - 10), method=6)

                # Backup o borrar original
                if keep_original:
                    os.replace(input_path, os.path.join(backup_dir, file))
                else:
                    os.remove(input_path)

                log_event("success", f"Optimizado: {file} -> {os.path.basename(webp_path)}")
                count += 1

            except Exception as e:
                log_event("error", f"Error procesando {file}: {e}")

    return count

if __name__ == "__main__":
    base_images_path = "public/images"
    sub_dirs = ["menu", "paisajes", "paisaje_1", "paisaje_2", "paisajes_3"]
    
    start = time.time()
    total = 0
    
    log_event("info", "Iniciando proceso de optimización masiva con límites anti-abuso.")
    
    for folder in sub_dirs:
        full_path = os.path.normpath(os.path.join(os.getcwd(), base_images_path, folder))
        total += optimize_images(full_path, quality=80, thumb_size=400, keep_original=True)

    log_event("info", f"Proceso completado. Total: {total} imágenes. Tiempo: {time.time() - start:.2f}s")