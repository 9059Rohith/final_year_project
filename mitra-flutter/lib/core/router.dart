import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/children/screens/child_picker_screen.dart';
import '../features/children/screens/child_detail_screen.dart';
import '../features/session/screens/session_screen.dart';
import '../features/progress/screens/progress_screen.dart';
import '../features/therapist/screens/therapist_dashboard_screen.dart';
import '../features/therapist/screens/content_builder_screen.dart';

class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const children = '/children';
  static const childDetail = '/children/:id';
  static const session = '/session/:programId';
  static const progress = '/progress/:childId';
  static const therapistDashboard = '/therapist';
  static const contentBuilder = '/therapist/content';
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    redirect: (context, state) {
      final isAuthenticated = authState.value != null;
      final isAuthRoute = state.fullPath == AppRoutes.login ||
          state.fullPath == AppRoutes.register ||
          state.fullPath == AppRoutes.splash;

      if (!isAuthRoute && !isAuthenticated && authState.hasValue) {
        return AppRoutes.login;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (ctx, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        pageBuilder: (ctx, state) => CustomTransitionPage(
          child: const LoginScreen(),
          transitionsBuilder: _fadeSlide,
        ),
      ),
      GoRoute(
        path: AppRoutes.register,
        pageBuilder: (ctx, state) => CustomTransitionPage(
          child: const RegisterScreen(),
          transitionsBuilder: _fadeSlide,
        ),
      ),
      GoRoute(
        path: AppRoutes.children,
        pageBuilder: (ctx, state) => CustomTransitionPage(
          child: const ChildPickerScreen(),
          transitionsBuilder: _fadeSlide,
        ),
      ),
      GoRoute(
        path: AppRoutes.childDetail,
        pageBuilder: (ctx, state) {
          final id = state.pathParameters['id']!;
          return CustomTransitionPage(
            child: ChildDetailScreen(childId: id),
            transitionsBuilder: _slideRight,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.session,
        pageBuilder: (ctx, state) {
          final programId = state.pathParameters['programId']!;
          final childId = state.uri.queryParameters['childId'] ?? '';
          return CustomTransitionPage(
            child: SessionScreen(programId: programId, childId: childId),
            transitionsBuilder: _slideUp,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.progress,
        pageBuilder: (ctx, state) {
          final childId = state.pathParameters['childId']!;
          return CustomTransitionPage(
            child: ProgressScreen(childId: childId),
            transitionsBuilder: _slideRight,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.therapistDashboard,
        pageBuilder: (ctx, state) => CustomTransitionPage(
          child: const TherapistDashboardScreen(),
          transitionsBuilder: _fadeSlide,
        ),
      ),
      GoRoute(
        path: AppRoutes.contentBuilder,
        pageBuilder: (ctx, state) => CustomTransitionPage(
          child: const ContentBuilderScreen(),
          transitionsBuilder: _slideRight,
        ),
      ),
    ],
  );
});

Widget _fadeSlide(ctx, animation, secondaryAnimation, child) {
  return FadeTransition(
    opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOut),
    child: SlideTransition(
      position: Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero)
          .animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
      child: child,
    ),
  );
}

Widget _slideRight(ctx, animation, secondaryAnimation, child) {
  return SlideTransition(
    position: Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
    child: child,
  );
}

Widget _slideUp(ctx, animation, secondaryAnimation, child) {
  return SlideTransition(
    position: Tween<Offset>(begin: const Offset(0, 1), end: Offset.zero)
        .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
    child: child,
  );
}
