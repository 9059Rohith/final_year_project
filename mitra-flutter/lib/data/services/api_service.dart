import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../models/models.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ApiService(dio);
});

class ApiService {
  final Dio _dio;
  ApiService(this._dio);

  // ── Auth ────────────────────────────────────────────────────────────────────
  Future<User> login(String email, String password) async {
    await _dio.post('/auth/login', data: {'email': email, 'password': password});
    return getMe();
  }

  Future<User> register({
    required String email,
    required String password,
    required String fullName,
    required String role,
    String? phone,
    String? licenseNumber,
    String? specialization,
  }) async {
    await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'full_name': fullName,
      'role': role,
      if (phone != null) 'phone': phone,
      if (licenseNumber != null) 'license_number': licenseNumber,
      if (specialization != null) 'specialization': specialization,
    });
    return login(email, password);
  }

  Future<User> getMe() async {
    final res = await _dio.get('/auth/me');
    return User.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }

  // ── Children ────────────────────────────────────────────────────────────────
  Future<List<Child>> getChildren() async {
    final res = await _dio.get('/auth/children');
    final list = res.data as List<dynamic>;
    return list.map((e) => Child.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Child> createChild({
    required String name,
    required int age,
    String? gender,
    String? avatarColor,
    String? diagnosisNotes,
    String? therapistId,
  }) async {
    final res = await _dio.post('/auth/children', data: {
      'name': name,
      'age': age,
      if (gender != null) 'gender': gender,
      if (avatarColor != null) 'avatar_color': avatarColor,
      if (diagnosisNotes != null) 'diagnosis_notes': diagnosisNotes,
      if (therapistId != null) 'therapist_id': therapistId,
    });
    return Child.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Parent dashboard ────────────────────────────────────────────────────────
  Future<List<AssignedProgram>> getChildPrograms(String childId) async {
    final res = await _dio.get('/parent/children/$childId/programs');
    final list = res.data as List<dynamic>;
    return list.map((e) => AssignedProgram.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── Content modules ─────────────────────────────────────────────────────────
  Future<List<TherapyModule>> getModules({bool publishedOnly = true}) async {
    final res = await _dio.get('/content/modules', queryParameters: {
      'published_only': publishedOnly,
    });
    final list = res.data as List<dynamic>;
    return list.map((e) => TherapyModule.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TherapyModule> getModule(String id) async {
    final res = await _dio.get('/content/modules/$id');
    return TherapyModule.fromJson(res.data as Map<String, dynamic>);
  }

  Future<TherapyModule> createModule({
    required String name,
    String? description,
    String? difficultyLevel,
  }) async {
    final res = await _dio.post('/content/modules', data: {
      'name': name,
      if (description != null) 'description': description,
      if (difficultyLevel != null) 'difficulty_level': difficultyLevel,
    });
    return TherapyModule.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ModuleItem> addModuleItem(String moduleId, {
    required String tamilWord,
    required String transliteration,
    required String englishTranslation,
    required int orderIndex,
    Map<String, dynamic>? phonemeBreakdown,
  }) async {
    final res = await _dio.post('/content/modules/$moduleId/items', data: {
      'tamil_word': tamilWord,
      'transliteration': transliteration,
      'english_translation': englishTranslation,
      'order_index': orderIndex,
      if (phonemeBreakdown != null) 'phoneme_breakdown': phonemeBreakdown,
    });
    return ModuleItem.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> publishModule(String id) async {
    await _dio.post('/content/modules/$id/publish');
  }

  // ── Sessions ────────────────────────────────────────────────────────────────
  Future<TherapySession> createSession(String childId, String programId) async {
    final res = await _dio.post('/sessions', data: {
      'child_id': childId,
      'program_id': programId,
    });
    return TherapySession.fromJson(res.data as Map<String, dynamic>);
  }

  Future<AttemptResult> submitAttempt(
    String sessionId,
    String itemId,
    String audioFilePath,
  ) async {
    final formData = FormData.fromMap({
      'audio': await MultipartFile.fromFile(audioFilePath, filename: 'recording.m4a'),
      'item_id': itemId,
    });
    final res = await _dio.post(
      '/sessions/$sessionId/attempts',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    return AttemptResult.fromJson(res.data as Map<String, dynamic>);
  }

  Future<AttemptResult> getAttemptStatus(String sessionId, String attemptId) async {
    final res = await _dio.get('/sessions/$sessionId/attempts/$attemptId/status');
    return AttemptResult.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> completeSession(String sessionId) async {
    await _dio.post('/sessions/$sessionId/complete');
  }

  Future<void> abandonSession(String sessionId) async {
    await _dio.post('/sessions/$sessionId/abandon');
  }

  // ── TTS ─────────────────────────────────────────────────────────────────────
  String getTtsUrl(String text) =>
      '${_dio.options.baseUrl}/tts/speak?text=${Uri.encodeComponent(text)}&lang=ta';

  // ── Progress ────────────────────────────────────────────────────────────────
  Future<ProgressSummary> getProgressSummary(String childId) async {
    final res = await _dio.get('/progress/child/$childId/summary');
    return ProgressSummary.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<TimeseriesPoint>> getTimeseries(String childId, {int days = 30}) async {
    final res = await _dio.get(
      '/progress/child/$childId/timeseries',
      queryParameters: {'days': days},
    );
    final list = res.data as List<dynamic>;
    return list.map((e) => TimeseriesPoint.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── Therapist ───────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getTherapistDashboard() async {
    final res = await _dio.get('/therapist/dashboard');
    return res.data as Map<String, dynamic>;
  }

  Future<List<Child>> getTherapistChildren() async {
    final res = await _dio.get('/therapist/children');
    final list = res.data as List<dynamic>;
    return list.map((e) => Child.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> assignProgram({
    required String childId,
    required String moduleId,
    int? targetSessionsPerWeek,
  }) async {
    await _dio.post('/therapist/assign-program', data: {
      'child_id': childId,
      'module_id': moduleId,
      if (targetSessionsPerWeek != null)
        'target_sessions_per_week': targetSessionsPerWeek,
    });
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  Future<List<AppNotification>> getNotifications({bool unreadOnly = false}) async {
    final res = await _dio.get('/notifications', queryParameters: {
      'unread_only': unreadOnly,
    });
    final list = res.data as List<dynamic>;
    return list.map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markNotificationRead(String id) async {
    await _dio.post('/notifications/$id/read');
  }
}
