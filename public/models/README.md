# face-api.js Model Files

Place the following model weight files here (download from https://github.com/justadudewhohacks/face-api.js/tree/master/weights):

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_tiny_model-weights_manifest.json`
- `face_landmark_68_tiny_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

These are loaded at runtime by the face scanner page via `/models/*`.

## Quick download (bash):
```bash
BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_tiny_model-weights_manifest.json"
  "face_landmark_68_tiny_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)
for f in "${FILES[@]}"; do curl -O "$BASE/$f"; done
```
