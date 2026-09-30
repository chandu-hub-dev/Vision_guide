# VisionGuide

A browser-based assistive vision prototype. It uses the device camera, runs COCO-SSD object detection in the browser, draws detections over the live feed, and announces newly appearing objects with browser text-to-speech.

## Run locally

```sh
npm install
npm run dev
```

Camera access requires `localhost` or an HTTPS origin. Allow camera permission when prompted. The first start downloads the TensorFlow.js runtime and COCO-SSD model files; inference then runs in the browser and camera frames are not sent to an application server.

## Detection and voice

COCO-SSD recognizes common objects including people, chairs, tables, bottles, backpacks, handbags, cars, bicycles, buses, and trucks. The interface shows model confidence scores and bounding boxes. Voice feedback announces newly appearing classes, prioritizes people and nearby transport/furniture classes, and applies a per-class cooldown. Voice can be muted independently of detection.

This is a prototype, not a substitute for a cane, guide dog, or other mobility support. Object detectors can miss objects, mislabel them, or fail to estimate distance and collision risk.

## Packages

- `@tensorflow/tfjs` provides the browser inference runtime.
- `@tensorflow-models/coco-ssd` provides pretrained object detection.
- `lucide-react` provides the interface icons.