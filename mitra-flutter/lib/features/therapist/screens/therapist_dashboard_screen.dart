import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../../../core/router.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';
import '../../../features/auth/providers/auth_provider.dart';

final therapistDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) {
  return ref.watch(apiServiceProvider).getTherapistDashboard();
});

final therapistChildrenProvider = FutureProvider<List<Child>>((ref) {
  return ref.watch(apiServiceProvider).getTherapistChildren();
});

class TherapistDashboardScreen extends ConsumerWidget {
  const TherapistDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final dashAsync = ref.watch(therapistDashboardProvider);
    final childrenAsync = ref.watch(therapistChildrenProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: AppColors.playGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hello, ${user?.fullName.split(' ').first ?? 'Doctor'} 👨‍⚕️',
                            style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                          ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1),
                          Text(
                            user?.role == 'admin' ? 'Administrator View' : 'Therapist Dashboard',
                            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
                          ).animate(delay: 150.ms).fadeIn(),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.push(AppRoutes.contentBuilder),
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.add, color: Colors.white, size: 24),
                      ),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: () async {
                        await ref.read(authStateProvider.notifier).logout();
                        if (context.mounted) context.go(AppRoutes.login);
                      },
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.logout_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: AppColors.calmBg,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(36),
                      topRight: Radius.circular(36),
                    ),
                  ),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
                    children: [
                      // Dashboard stats
                      dashAsync.when(
                        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.secondary)),
                        error: (_, __) => const SizedBox.shrink(),
                        data: (dash) => _DashStats(dash: dash),
                      ),
                      const SizedBox(height: 24),
                      // Quick actions
                      const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _QuickAction(
                            emoji: '📝',
                            label: 'Create\nModule',
                            colors: AppColors.calmGradient,
                            onTap: () => context.push(AppRoutes.contentBuilder),
                          ),
                          const SizedBox(width: 12),
                          _QuickAction(
                            emoji: '📊',
                            label: 'View\nReports',
                            colors: AppColors.warmGradient,
                            onTap: () {},
                          ),
                          const SizedBox(width: 12),
                          _QuickAction(
                            emoji: '👶',
                            label: 'Assign\nProgram',
                            colors: AppColors.playGradient,
                            onTap: () {},
                          ),
                        ],
                      ).animate(delay: 150.ms).fadeIn(),
                      const SizedBox(height: 24),
                      // Children
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('My Patients', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                          GestureDetector(
                            onTap: () => ref.refresh(therapistChildrenProvider),
                            child: const Text('Refresh', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      childrenAsync.when(
                        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.secondary)),
                        error: (_, __) => const Text('Failed to load patients'),
                        data: (children) => children.isEmpty
                            ? _EmptyPatients()
                            : Column(
                                children: children.asMap().entries.map((e) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: _PatientCard(child: e.value, index: e.key),
                                  );
                                }).toList(),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashStats extends StatelessWidget {
  final Map<String, dynamic> dash;
  const _DashStats({required this.dash});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _MiniStat(value: '${dash['total_children'] ?? 0}', label: 'Patients', color: AppColors.secondary),
        const SizedBox(width: 12),
        _MiniStat(value: '${dash['total_modules'] ?? 0}', label: 'Modules', color: AppColors.teal),
        const SizedBox(width: 12),
        _MiniStat(value: '${dash['sessions_this_week'] ?? 0}', label: 'Sessions\nThis Week', color: AppColors.primary),
      ],
    ).animate().fadeIn(duration: 400.ms);
  }
}

class _MiniStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _MiniStat({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 4),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final String emoji;
  final String label;
  final List<Color> colors;
  final VoidCallback onTap;
  const _QuickAction({required this.emoji, required this.label, required this.colors, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: colors),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: colors.first.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(height: 6),
              Text(label, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PatientCard extends StatelessWidget {
  final Child child;
  final int index;
  const _PatientCard({required this.child, required this.index});

  @override
  Widget build(BuildContext context) {
    final grad = AppColors.lessonGradients[index % AppColors.lessonGradients.length];
    return GestureDetector(
      onTap: () => context.push('/children/${child.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
        ),
        child: Row(
          children: [
            Container(
              width: 54, height: 54,
              decoration: BoxDecoration(gradient: LinearGradient(colors: grad), shape: BoxShape.circle),
              child: Center(child: Text(child.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20))),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(child.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textPrimary)),
                  if (child.age != null)
                    Text('Age ${child.age}', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => context.push('/progress/${child.id}'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.surfaceBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text('Progress', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    ).animate(delay: Duration(milliseconds: 100 * index)).fadeIn().slideX(begin: 0.05);
  }
}

class _EmptyPatients extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
      child: const Column(
        children: [
          Text('👶', style: TextStyle(fontSize: 52)),
          SizedBox(height: 12),
          Text('No patients yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          SizedBox(height: 8),
          Text(
            'Patients will appear here once parents register their children.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
