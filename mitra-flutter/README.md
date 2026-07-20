# Mitra Flutter — Tamil AI Speech Companion

A polished Flutter application for the **Mitra** Tamil Speech Therapy system targeting children with ASD.

## 🏗️ Architecture

```
mitra-flutter/
├── lib/
│   ├── main.dart                         # Entry point
│   ├── core/
│   │   ├── router.dart                   # GoRouter navigation
│   │   └── api_client.dart               # Dio HTTP client w/ cookie auth
│   ├── theme/
│   │   └── app_theme.dart                # Colors, gradients, Material3 theme
│   ├── data/
│   │   ├── models/models.dart            # User, Child, Module, Session, Progress
│   │   └── services/api_service.dart     # All Mitra backend API calls
│   ├── features/
│   │   ├── auth/
│   │   │   ├── providers/auth_provider.dart
│   │   │   └── screens/ (splash, login, register)
│   │   ├── children/
│   │   │   └── screens/ (picker, detail, add_child_sheet)
│   │   ├── session/
│   │   │   └── screens/session_screen.dart  # Core practice screen w/ ASR
│   │   ├── progress/
│   │   │   └── screens/progress_screen.dart # Charts, mastery, streaks
│   │   └── therapist/
│   │       └── screens/ (dashboard, content_builder)
│   └── shared/
│       └── widgets/ (GradientButton, MitraTextField)
└── android/
    └── app/src/main/AndroidManifest.xml  # Mic, internet, storage permissions
```

## 🎨 Design System

| Token | Value |
|---|---|
| Primary (warm orange) | `#FF6B35` |
| Secondary (purple) | `#7C3AED` |
| Teal | `#00B4D8` |
| Background | `#FFF7F0` |
| Font | Poppins (via google_fonts) |
| Tamil font | NotoSansTamil |

## 🚀 Quick Start

### Prerequisites
- Flutter 3.19+ (`flutter --version`)
- Dart 3.3+
- Mitra backend running at `localhost:8000`

### Setup

```bash
cd mitra-flutter
flutter pub get
flutter run
```

> **Android Emulator**: Backend URL is pre-configured as `http://10.0.2.2:8000/api` (emulator → host machine).
> **Physical device**: Edit `lib/core/api_client.dart` and set `kBaseUrl` to your machine's LAN IP.

### Build APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

## 📱 Screens

| Screen | Route | Description |
|---|---|---|
| Splash | `/` | Animated logo + auto-auth check |
| Login | `/login` | Email/password + demo credentials |
| Register | `/register` | Parent or Therapist registration |
| Child Picker | `/children` | Parent home — select child to practice |
| Child Detail | `/children/:id` | Assigned programs + progress shortcut |
| Session | `/session/:programId` | **Core**: Hear Tamil → Record → AI score |
| Progress | `/progress/:childId` | Mastery %, line chart, per-module stats |
| Therapist Dashboard | `/therapist` | Patient list, stats, quick actions |
| Content Builder | `/therapist/content` | Step-by-step Tamil module creation |

## 🎙️ Session Flow

```
1. App creates session via POST /sessions
2. Child taps 🔊 to hear TTS pronunciation
3. Child taps 🎙 to start recording
4. Taps ⏹ to stop → audio POSTed to /sessions/{id}/attempts
5. App polls /attempts/{id}/status every 2s
6. Score displayed with emoji feedback (🌟 ≥80, 👍 ≥50, 💪 <50)
7. After all items → session completed → celebration screen
```

## 🔑 State Management

- **Riverpod** (`flutter_riverpod`) for all state
- `authStateProvider` — current user, login/logout
- `childrenProvider` — FutureProvider for child list
- `childProgramsProvider` — FutureProvider.family per child
- `progressSummaryProvider` — FutureProvider.family per child

## 📦 Key Dependencies

| Package | Use |
|---|---|
| `flutter_riverpod` | State management |
| `go_router` | Declarative navigation |
| `dio` + `dio_cookie_manager` | HTTP with session cookies |
| `record` | Audio recording (AAC/m4a) |
| `just_audio` | TTS playback |
| `fl_chart` | Progress line charts |
| `flutter_animate` | Smooth animations |
| `google_fonts` | Poppins font |
| `permission_handler` | Mic permission |

## 🌐 API Integration

Points to `mitra-backend` (FastAPI). All cookies are persisted via `PersistCookieJar`.

Change backend URL in `lib/core/api_client.dart`:
```dart
const String kBaseUrl = 'http://10.0.2.2:8000/api'; // emulator
// const String kBaseUrl = 'http://192.168.1.x:8000/api'; // LAN device
