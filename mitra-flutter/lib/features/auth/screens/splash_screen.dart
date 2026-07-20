import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../../../core/router.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2200));
    if (!mounted) return;
    final auth = ref.read(authStateProvider);
    auth.when(
      data: (user) {
        if (user != null) {
          if (user.role == 'therapist' || user.role == 'admin') {
            context.go(AppRoutes.therapistDashboard);
          } else {
            context.go(AppRoutes.children);
          }
        } else {
          context.go(AppRoutes.login);
        }
      },
      loading: () => context.go(AppRoutes.login),
      error: (_, __) => context.go(AppRoutes.login),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: AppColors.warmGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(flex: 2),
              // Robot companion logo
              Center(
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(40),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 30,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text('🤖', style: TextStyle(fontSize: 72)),
                  ),
                )
                    .animate()
                    .fadeIn(duration: 600.ms, curve: Curves.easeOut)
                    .scale(begin: const Offset(0.6, 0.6), curve: Curves.elasticOut, duration: 900.ms),
              ),
              const SizedBox(height: 28),
              // App name
              const Text(
                'Mitra',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 52,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              )
                  .animate(delay: 300.ms)
                  .fadeIn(duration: 500.ms)
                  .slideY(begin: 0.3, end: 0),
              const SizedBox(height: 10),
              Text(
                'மிட்ரா',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 4,
                  fontFamily: 'NotoSansTamil',
                ),
              )
                  .animate(delay: 500.ms)
                  .fadeIn(duration: 500.ms),
              const SizedBox(height: 16),
              Text(
                'Tamil Speech Companion',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.85),
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1,
                ),
              )
                  .animate(delay: 700.ms)
                  .fadeIn(duration: 500.ms),
              const Spacer(flex: 3),
              // Loading dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (i) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 5),
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.7),
                      shape: BoxShape.circle,
                    ),
                  )
                      .animate(delay: Duration(milliseconds: 900 + i * 150))
                      .fadeIn(duration: 400.ms)
                      .then()
                      .scale(
                        begin: const Offset(1, 1),
                        end: const Offset(1.4, 1.4),
                        duration: 600.ms,
                        curve: Curves.easeInOut,
                      )
                      .then()
                      .scale(
                        begin: const Offset(1.4, 1.4),
                        end: const Offset(1, 1),
                        duration: 600.ms,
                        curve: Curves.easeInOut,
                      );
                }),
              ),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }
}
