#!/usr/bin/env python3
"""
scripts/mask-tutorial-images.py

把 tutorial 截圖裡的個資(App 名 / Threads handle / 顯示名 / 大頭照 / post 內容)
用色塊蓋掉,輸出到指定資料夾。

用法:
    .venv/bin/python scripts/mask-tutorial-images.py \\
        --input input/images \\
        --output .worktrees/tutorial-ig-api/public/screenshots/tutorial-ig-api \\
        --config scripts/mask-tutorial-images.config.json

Config JSON 結構(每個 image filename 一個 entry):
{
  "<input-filename>.png": {
    "out": "<output-filename>.png",
    "ocr_mask": ["n8n_threads_0927", "meme.friend.s"],   // OCR 找這些字串遮掉
    "manual_mask": [                                       // 額外手動 bbox(大頭照、無法 OCR 的)
      {"x1": 60, "y1": 200, "x2": 100, "y2": 240, "color": "#000000"},
      {
        "x1": 200, "y1": 100, "x2": 400, "y2": 130,
        "replace_with": "Test User",
        "bg": "#ffffff",
        "color": "#333333",
        "fontSize": 20
      }
    ]
  }
}

manual_mask 欄位說明:
  x1, y1, x2, y2  必填,bbox 像素座標
  color            無 replace_with 時的色塊顏色(預設 #000000)
                   有 replace_with 時作為文字顏色(預設 #333333)
  replace_with     若有此欄,改用「底色填滿 + 文字置中」取代黑塊
  bg               replace_with 模式的底色(預設 #ffffff)
  fontSize         replace_with 模式的字級(預設 18,會自動縮小以適應寬度)
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import pytesseract

# 預設使用 Liberation Sans,支援英文 placeholder 足夠
_FONT_PATH = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
_FONT_PATH_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"


def _hex_to_rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return (r, g, b, alpha)


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = _FONT_PATH_BOLD if bold else _FONT_PATH
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def _fit_font(draw: ImageDraw.ImageDraw, text: str, max_w: int, max_h: int, start_size: int) -> tuple[ImageFont.FreeTypeFont, int, int]:
    """從 start_size 往下縮直到文字能放進 max_w x max_h,回傳 (font, tw, th)。"""
    size = start_size
    while size >= 8:
        font = _load_font(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        if tw <= max_w and th <= max_h:
            return font, tw, th
        size -= 2
    font = _load_font(8)
    bbox = draw.textbbox((0, 0), text, font=font)
    return font, bbox[2] - bbox[0], bbox[3] - bbox[1]


def find_text_bboxes(img_path: Path, targets: list[str]) -> list[tuple[int, int, int, int]]:
    """OCR 整張圖,回傳所有命中 targets(子字串)的 bbox(x1, y1, x2, y2)。"""
    img = Image.open(img_path)
    data = pytesseract.image_to_data(
        img,
        lang="chi_tra+eng",
        output_type=pytesseract.Output.DICT,
    )
    matches: list[tuple[int, int, int, int]] = []
    for i, raw in enumerate(data["text"]):
        text = (raw or "").strip()
        if not text:
            continue
        for target in targets:
            # 子字串匹配,涵蓋 OCR 可能少幾個字元
            if target in text or text in target or target.replace(".", "") in text.replace(".", ""):
                x = data["left"][i]
                y = data["top"][i]
                w = data["width"][i]
                h = data["height"][i]
                # 邊界各放大 4px 確保完全蓋住
                matches.append((max(0, x - 4), max(0, y - 4), x + w + 4, y + h + 4))
                break
    return matches


def apply_replace_with(
    draw: ImageDraw.ImageDraw,
    bbox: tuple[int, int, int, int],
    text: str,
    bg_color: str,
    text_color: str,
    font_size: int,
):
    """在 bbox 區域填底色並在中央畫佔位文字。"""
    x1, y1, x2, y2 = bbox
    bg_fill = _hex_to_rgba(bg_color)
    txt_fill = _hex_to_rgba(text_color)

    # 填底色
    draw.rectangle(bbox, fill=bg_fill)

    # 計算最適字型大小
    max_w = (x2 - x1) - 4   # 左右留 2px padding
    max_h = (y2 - y1) - 2
    font, tw, th = _fit_font(draw, text, max_w, max_h, font_size)

    # 文字置中
    cx = x1 + (x2 - x1) // 2
    cy = y1 + (y2 - y1) // 2
    tx = cx - tw // 2
    ty = cy - th // 2

    draw.text((tx, ty), text, font=font, fill=txt_fill)


def mask_image(
    in_path: Path,
    out_path: Path,
    ocr_targets: list[str],
    manual_masks: list[dict],
):
    img = Image.open(in_path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # 1. OCR-driven masks(維持黑塊)
    auto_count = 0
    if ocr_targets:
        overlay_ocr = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw_ocr = ImageDraw.Draw(overlay_ocr)
        for bbox in find_text_bboxes(in_path, ocr_targets):
            draw_ocr.rectangle(bbox, fill=(0, 0, 0, 255))
            auto_count += 1
        img = Image.alpha_composite(img, overlay_ocr)
        draw = ImageDraw.Draw(img)

    # 2. Manual masks
    manual_count = 0
    replace_count = 0
    for m in manual_masks:
        bbox = (m["x1"], m["y1"], m["x2"], m["y2"])

        if "replace_with" in m:
            # 佔位符模式:底色 + 文字
            bg = m.get("bg", "#ffffff")
            color = m.get("color", "#333333")
            font_size = m.get("fontSize", 18)
            apply_replace_with(draw, bbox, m["replace_with"], bg, color, font_size)
            replace_count += 1
        else:
            # 舊模式:純色塊(向後相容)
            color = m.get("color", "#000000")
            fill = _hex_to_rgba(color)
            draw.rectangle(bbox, fill=fill)
            manual_count += 1

    out_img = img.convert("RGB")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_img.save(out_path, format="PNG")
    print(
        f"  ✓ {in_path.name} → {out_path.name}"
        f"  (OCR: {auto_count} / solid: {manual_count} / replace: {replace_count})"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="原圖資料夾")
    parser.add_argument("--output", required=True, help="輸出資料夾")
    parser.add_argument("--config", required=True, help="JSON 設定檔")
    args = parser.parse_args()

    in_dir = Path(args.input)
    out_dir = Path(args.output)
    config_path = Path(args.config)

    if not config_path.exists():
        print(f"❌ config 不存在:{config_path}", file=sys.stderr)
        sys.exit(1)

    cfg = json.loads(config_path.read_text(encoding="utf-8"))
    print(f"處理 {len(cfg)} 張圖,輸出到 {out_dir}\n")

    for filename, opts in cfg.items():
        in_path = in_dir / filename
        if not in_path.exists():
            print(f"  ✗ 找不到 {in_path}", file=sys.stderr)
            continue
        out_path = out_dir / opts["out"]
        mask_image(
            in_path,
            out_path,
            ocr_targets=opts.get("ocr_mask", []),
            manual_masks=opts.get("manual_mask", []),
        )


if __name__ == "__main__":
    main()
