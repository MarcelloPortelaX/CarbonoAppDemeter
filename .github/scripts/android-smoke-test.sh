#!/usr/bin/env bash
set -Eeuo pipefail

PACKAGE="com.demeter.carbono"
ACTIVITY="com.demeter.carbono/.MainActivity"
APK="apps/mobile/dist/demeter-carbono.apk"
LOGCAT="logcat.txt"
WINDOW_XML="window.xml"

echo "Checking if APK exists..."
test -f "$APK"

echo "Waiting for device to become ready..."
adb wait-for-device

echo "Waiting for boot to complete..."
BOOT_COMPLETED=""
for attempt in $(seq 1 60); do
  BOOT_COMPLETED="$(adb shell getprop sys.boot_completed | tr -d '\r')"
  if [ "$BOOT_COMPLETED" = "1" ]; then
    echo "Boot completed on attempt $attempt."
    break
  fi
  sleep 2
done

if [ "$BOOT_COMPLETED" != "1" ]; then
  echo "Android emulator did not finish booting."
  exit 1
fi

echo "Installing APK..."
adb install -r "$APK"

echo "Stopping any existing process and clearing logcat..."
adb shell am force-stop "$PACKAGE" || true
adb logcat -c

echo "Starting MainActivity..."
adb shell am start -W -n "$ACTIVITY"

echo "Waiting for app to initialize..."
sleep 15

echo "Checking process..."
PID="$(adb shell pidof -s "$PACKAGE" | tr -d '\r' || true)"

adb logcat -d > "$LOGCAT"

if [ -z "$PID" ]; then
  echo "Application process is not running."
  cat "$LOGCAT"
  exit 1
fi

echo "Checking for native Android crashes..."
if grep -Eq "Process: com\.demeter\.carbono|Fatal signal .*com\.demeter\.carbono" "$LOGCAT"; then
  echo "Native Android crash detected."
  cat "$LOGCAT"
  exit 1
fi

echo "Checking for React Native JS crashes..."
if grep -Eq "ReactNativeJS.*(TypeError|ReferenceError|Invariant Violation|Unhandled JS Exception)" "$LOGCAT"; then
  echo "Fatal React Native JavaScript error detected."
  cat "$LOGCAT"
  exit 1
fi

echo "Dumping UI layout to confirm home screen..."
for i in {1..4}; do
  adb shell uiautomator dump /sdcard/window.xml
  adb pull /sdcard/window.xml window.xml
  
  if grep -q "isn't responding" window.xml; then
    echo "Detected 'isn't responding' ANR dialog. Dismissing by pressing Wait/Back..."
    # Press TAB to navigate buttons or BACK to dismiss
    adb shell input keyevent 4
    sleep 3
    continue
  fi

  if grep -Eq "Minhas áreas|DEMETER CARBONO|Nova área" window.xml; then
    echo "Expected home UI found!"
    break
  fi

  echo "UI not ready yet, waiting 5 seconds..."
  sleep 5
done

echo "Checking UI layout for expected text..."
if ! grep -Eq "Minhas áreas|DEMETER CARBONO|Nova área" window.xml; then
  echo "Application process is alive, but expected home UI was not found."
  cat window.xml
  cat logcat.txt
  exit 1
fi

echo "Android smoke test passed."
