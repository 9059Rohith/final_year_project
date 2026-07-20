import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

// Current authenticated user — null means logged out
final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier(ref.watch(apiServiceProvider));
});

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final ApiService _api;
  AuthNotifier(this._api) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final user = await _api.getMe();
      state = AsyncValue.data(user);
    } catch (_) {
      state = const AsyncValue.data(null);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _api.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      // Without this, the caller's try/catch never fires on a real failure —
      // the login screen would silently stop loading with no error shown.
      rethrow;
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String fullName,
    required String role,
    String? phone,
    String? licenseNumber,
    String? specialization,
  }) async {
    state = const AsyncValue.loading();
    try {
      final user = await _api.register(
        email: email,
        password: password,
        fullName: fullName,
        role: role,
        phone: phone,
        licenseNumber: licenseNumber,
        specialization: specialization,
      );
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      // Same reasoning as login() — the register screen's try/catch needs
      // this to actually see the failure and show an error to the user.
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } finally {
      state = const AsyncValue.data(null);
    }
  }

  Future<void> refresh() => _init();
}

// Convenience derived providers
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authStateProvider).value;
});

final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider) != null;
});

final isTherapistProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider)?.role == 'therapist';
});

final isAdminProvider = Provider<bool>((ref) {
  return ref.watch(currentUserProvider)?.role == 'admin';
});
