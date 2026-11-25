#!/usr/bin/env bash
# 把录屏关键帧合成为各段的 mp4 素材（供 compose.py 引用）
#
# 每个段 = 若干帧拼接 + Ken Burns 缓慢推近
set -uo pipefail

DEMO="C:/Users/HUAWEI/AppData/Local/Temp/demo"
SCENES="C:/Users/HUAWEI/AppData/Local/Temp/scenes"
OUT="$DEMO/assets"
mkdir -p "$OUT"

W=1920; H=1080; FPS=30

# 从 1440x900 的截图放大到 1920x1080（保持比例 + 补白），并加缓慢推近
mkseg () {
  local name="$1"; shift
  local dur="$1"; shift
  local files=("$@")
  local list="$DEMO/build/${name}_list.txt"
  mkdir -p "$DEMO/build"
  : > "$list"

  # 按帧数分配时长（均分）
  local n=${#files[@]}
  local per=$(python -c "print($dur/$n)")

  for f in "${files[@]}"; do
    echo "file '$SCENES/$f'" >> "$list"
    echo "duration $per" >> "$list"
  done
  # concat demuxer 需要最后一帧重复一次
  echo "file '$SCENES/${files[${#files[@]}-1]}'" >> "$list"

  # 用 concat demuxer + 显式 -r（坑 #2：图片序列默认 25fps 会吃掉 1/5 时长）
  ffmpeg -y -f concat -safe 0 -i "$list" -r $FPS \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0xf5f6fa,format=yuv420p" \
    -t "$dur" -c:v libx264 -preset medium -crf 20 -r $FPS -movflags +faststart \
    "$OUT/${name}.mp4" 2>/dev/null

  local got=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "$OUT/${name}.mp4" 2>/dev/null)
  printf "  %-12s %s  →  %.1fs (目标 %ss)\n" "$name" "$(ls -la "$OUT/${name}.mp4" 2>/dev/null | awk '{print $5}')" "${got:-0}" "$dur"
}

echo "=== 生成各段视频素材 ==="

# S2 作战台：全景 + 打卡卡
mkseg seg_s2 8.0 scene_s2_001.png scene_s2_002.png scene_s2_002.png scene_s2_002.png

# S3 匹配器：表单 + 填完
mkseg seg_s3 8.5 scene_s3_003.png scene_s3_003.png scene_s3_004.png scene_s3_004.png

# S3B 结果：结果 + 特写
mkseg seg_s3b 8.0 scene_s3_005.png scene_s3_006.png scene_s3_006.png scene_s3_006.png

# S4 计划：概览 + 勾选 + 阶段3
mkseg seg_s4 9.0 scene_s4_007.png scene_s4_008.png scene_s4_009.png scene_s4_009.png

# S5 打卡 + 报告库
mkseg seg_s5 8.0 scene_s5_010.png scene_s5_011.png scene_s5_012.png scene_s5_012.png

# S7 Pi 登录段：用作战台最终帧（PiNet 徽章在页脚）
mkseg seg_s7 9.5 scene_s6_013.png scene_s6_013.png scene_s6_013.png scene_s6_013.png

# S7B PiNet
mkseg seg_s7b 8.0 scene_s6_013.png scene_s6_013.png scene_s6_013.png


# S4B 计划特写（阶段3 留存与社区）
mkseg seg_s4b 6.0 scene_s4_009.png scene_s4_009.png scene_s4_009.png

# S5B 报告库（交叉验证表）
mkseg seg_s5b 9.0 scene_s5_012.png scene_s5_012.png scene_s5_012.png

echo
echo "=== 素材清单 ==="
ls -la "$OUT"/*.mp4 2>/dev/null | awk '{printf "  %-28s %8.1f KB\n", $9, $5/1024}'
