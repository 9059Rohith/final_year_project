// ─────────────────────────────────────────────────────────────────────────────
// All data models for Mitra Flutter app
// ─────────────────────────────────────────────────────────────────────────────

class User {
  final String id;
  final String email;
  final String fullName;
  final String role; // 'parent' | 'therapist' | 'admin'
  final bool isActive;
  final String? avatarUrl;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] ?? '',
        email: j['email'] ?? '',
        fullName: j['full_name'] ?? '',
        role: j['role'] ?? 'parent',
        isActive: j['is_active'] ?? true,
        avatarUrl: j['avatar_url'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role,
        'is_active': isActive,
        'avatar_url': avatarUrl,
      };
}

// ── Child ─────────────────────────────────────────────────────────────────────
class Child {
  final String id;
  final String name;
  final int? age;
  final String? gender;
  final String avatarColor;
  final String? diagnosisNotes;
  final String? therapistId;
  final bool isActive;

  const Child({
    required this.id,
    required this.name,
    this.age,
    this.gender,
    required this.avatarColor,
    this.diagnosisNotes,
    this.therapistId,
    required this.isActive,
  });

  factory Child.fromJson(Map<String, dynamic> j) => Child(
        id: j['id'] ?? '',
        name: j['name'] ?? '',
        age: j['age'],
        gender: j['gender'],
        avatarColor: j['avatar_color'] ?? '#FF6B35',
        diagnosisNotes: j['diagnosis_notes'],
        therapistId: j['therapist_id'],
        isActive: j['is_active'] ?? true,
      );

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}

// ── Module / Program ──────────────────────────────────────────────────────────
class TherapyModule {
  final String id;
  final String title;
  final String? description;
  final String difficulty;
  final bool isPublished;
  final String language;
  final int? targetAgeMin;
  final int? targetAgeMax;
  final List<ModuleItem> items;

  const TherapyModule({
    required this.id,
    required this.title,
    this.description,
    required this.difficulty,
    required this.isPublished,
    required this.language,
    this.targetAgeMin,
    this.targetAgeMax,
    this.items = const [],
  });

  factory TherapyModule.fromJson(Map<String, dynamic> j) => TherapyModule(
        id: j['id'] ?? '',
        title: j['title'] ?? j['name'] ?? '',
        description: j['description'],
        difficulty: j['difficulty'] ?? 'beginner',
        isPublished: j['is_published'] ?? false,
        language: j['language'] ?? 'ta',
        targetAgeMin: j['target_age_min'],
        targetAgeMax: j['target_age_max'],
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => ModuleItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ModuleItem {
  final String id;
  final String tamilWord;
  final String transliteration;
  final String englishTranslation;
  final String? imageUrl;
  final int orderIndex;
  final Map<String, dynamic>? phonemeBreakdown;

  const ModuleItem({
    required this.id,
    required this.tamilWord,
    required this.transliteration,
    required this.englishTranslation,
    this.imageUrl,
    required this.orderIndex,
    this.phonemeBreakdown,
  });

  factory ModuleItem.fromJson(Map<String, dynamic> j) => ModuleItem(
        id: j['id'] ?? '',
        tamilWord: j['tamil_word'] ?? j['target_word'] ?? '',
        transliteration: j['transliteration'] ?? '',
        englishTranslation: j['english_translation'] ?? j['meaning'] ?? '',
        imageUrl: j['image_url'],
        orderIndex: j['order_index'] ?? 0,
        phonemeBreakdown: j['phoneme_breakdown'],
      );
}

// ── Assigned Program ──────────────────────────────────────────────────────────
class AssignedProgram {
  final String id;
  final String moduleId;
  final String moduleTitle;
  final String? moduleDescription;
  final String? difficultyLevel;
  final bool isActive;
  final int? targetSessionsPerWeek;
  final double? masteryScore;
  final String? trend;

  const AssignedProgram({
    required this.id,
    required this.moduleId,
    required this.moduleTitle,
    this.moduleDescription,
    this.difficultyLevel,
    required this.isActive,
    this.targetSessionsPerWeek,
    this.masteryScore,
    this.trend,
  });

  // Matches parent.py's get_programs_for_child response shape exactly:
  // {id, module_id, module_name, module_description, difficulty_level,
  //  is_active, target_sessions_per_week, mastery_score, trend}
  factory AssignedProgram.fromJson(Map<String, dynamic> j) => AssignedProgram(
        id: j['id'] ?? '',
        moduleId: j['module_id'] ?? '',
        moduleTitle: j['module_name'] ?? '',
        moduleDescription: j['module_description'],
        difficultyLevel: j['difficulty_level'],
        isActive: j['is_active'] ?? true,
        targetSessionsPerWeek: j['target_sessions_per_week'],
        masteryScore: (j['mastery_score'] as num?)?.toDouble(),
        trend: j['trend'],
      );

  String get statusLabel => isActive ? 'Start' : 'Completed ✓';
}

// ── Session ───────────────────────────────────────────────────────────────────
class TherapySession {
  final String id;
  final List<ModuleItem> items;
  final String childName;
  final String moduleName;
  final String status;

  const TherapySession({
    required this.id,
    required this.items,
    required this.childName,
    required this.moduleName,
    required this.status,
  });

  factory TherapySession.fromJson(Map<String, dynamic> j) => TherapySession(
        id: j['id'] ?? '',
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => ModuleItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        childName: j['child_name'] ?? '',
        moduleName: j['module_name'] ?? '',
        status: j['status'] ?? 'in_progress',
      );
}

// ── Attempt ───────────────────────────────────────────────────────────────────
class AttemptResult {
  final String attemptId;
  final String status; // 'pending' | 'done' | 'failed'
  final double? score;
  final String? transcript;
  final String? mitraResponseType;

  const AttemptResult({
    required this.attemptId,
    required this.status,
    this.score,
    this.transcript,
    this.mitraResponseType,
  });

  factory AttemptResult.fromJson(Map<String, dynamic> j) => AttemptResult(
        attemptId: j['attempt_id'] ?? j['id'] ?? '',
        // Backend field is `scoring_status`, not `status` — without this
        // fallback, polling never detects "done" and always times out.
        status: j['status'] ?? j['scoring_status'] ?? 'pending',
        score: (j['score'] as num?)?.toDouble() ??
            (j['similarity_score'] as num?)?.toDouble(),
        transcript: j['transcript'] ?? j['asr_transcript'],
        mitraResponseType: j['mitra_response_type'],
      );

  bool get isExcellent => (score ?? 0) >= 80;
  bool get isGood => (score ?? 0) >= 50;
}

// ── Progress ──────────────────────────────────────────────────────────────────
// The backend splits progress across 4 separate endpoints — summary,
// timeseries, by-module, and streaks — rather than one combined payload.
// These four classes match each endpoint's actual response exactly;
// ProgressBundle (below) combines them for the screen.

class ProgressSummary {
  final String childId;
  final String childName;
  final int totalSessions;
  final int completedSessions;
  final double? overallAverageScore;
  final double? overallAttemptAverage;
  final int sessionsThisWeek;
  final int totalAttempts;
  final List<ModuleProgress> moduleProgress;

  const ProgressSummary({
    required this.childId,
    required this.childName,
    required this.totalSessions,
    required this.completedSessions,
    this.overallAverageScore,
    this.overallAttemptAverage,
    required this.sessionsThisWeek,
    required this.totalAttempts,
    this.moduleProgress = const [],
  });

  factory ProgressSummary.fromJson(Map<String, dynamic> j) => ProgressSummary(
        childId: j['child_id'] ?? '',
        childName: j['child_name'] ?? '',
        totalSessions: j['total_sessions'] ?? 0,
        completedSessions: j['completed_sessions'] ?? 0,
        overallAverageScore: (j['overall_average_score'] as num?)?.toDouble(),
        overallAttemptAverage: (j['overall_attempt_average'] as num?)?.toDouble(),
        sessionsThisWeek: j['sessions_this_week'] ?? 0,
        totalAttempts: j['total_attempts'] ?? 0,
        moduleProgress: (j['module_progress'] as List<dynamic>? ?? [])
            .map((e) => ModuleProgress.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class ModuleProgress {
  final String moduleId;
  final String moduleName;
  final double masteryScore;
  final String trend;
  final int itemsMastered;
  final int sessionCount;

  const ModuleProgress({
    required this.moduleId,
    required this.moduleName,
    required this.masteryScore,
    required this.trend,
    required this.itemsMastered,
    required this.sessionCount,
  });

  factory ModuleProgress.fromJson(Map<String, dynamic> j) => ModuleProgress(
        moduleId: j['module_id'] ?? '',
        moduleName: j['module_name'] ?? '',
        masteryScore: (j['mastery_score'] as num?)?.toDouble() ?? 0,
        trend: j['trend'] ?? 'stable',
        itemsMastered: j['items_mastered'] ?? 0,
        sessionCount: j['session_count'] ?? 0,
      );
}

class StreakInfo {
  final int currentStreak;
  final int bestStreak;
  final int totalPracticeDays;

  const StreakInfo({
    required this.currentStreak,
    required this.bestStreak,
    required this.totalPracticeDays,
  });

  factory StreakInfo.fromJson(Map<String, dynamic> j) => StreakInfo(
        currentStreak: j['current_streak'] ?? 0,
        bestStreak: j['best_streak'] ?? 0,
        totalPracticeDays: j['total_practice_days'] ?? 0,
      );
}

class TimeseriesPoint {
  final DateTime date;
  final double score;
  final int sessions;

  const TimeseriesPoint({
    required this.date,
    required this.score,
    required this.sessions,
  });

  factory TimeseriesPoint.fromJson(Map<String, dynamic> j) => TimeseriesPoint(
        date: DateTime.tryParse(j['date'] ?? '') ?? DateTime.now(),
        score: (j['average_score'] as num?)?.toDouble() ?? 0,
        sessions: j['session_count'] ?? 0,
      );
}

/// Combines the 4 separate progress endpoints for the progress screen —
/// fetched together via ApiService.getFullProgress().
class ProgressBundle {
  final ProgressSummary summary;
  final StreakInfo streak;
  final List<TimeseriesPoint> timeseries;

  const ProgressBundle({
    required this.summary,
    required this.streak,
    required this.timeseries,
  });
}

// ── Notification ──────────────────────────────────────────────────────────────
class AppNotification {
  final String id;
  final String type;
  final String title;
  final String? body;
  final bool isRead;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    this.body,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] ?? '',
        type: j['type'] ?? 'system',
        title: j['title'] ?? '',
        body: j['body'],
        isRead: j['is_read'] ?? false,
        createdAt: DateTime.tryParse(j['created_at'] ?? '') ?? DateTime.now(),
      );
}
