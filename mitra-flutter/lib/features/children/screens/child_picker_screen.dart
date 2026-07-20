import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../../../core/router.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/gradient_button.dart';
import 'add_child_sheet.dart';

final childrenProvider = FutureProvider<List<Child>>((ref) async {
  return ref.watch(apiServiceProvider).getChildren();
});

class ChildPickerScreen extends ConsumerWidget {
  const ChildPickerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final childrenAsync = ref.watch(childrenProvider);

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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hi, ${user?.fullName.split(' ').first ?? 'there'}! 👋',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                            ),
                          ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1),
                          const SizedBox(height: 4),
                          Text(
                            'Who is practicing today?',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.85),
                              fontSize: 16,
                            ),
                          ).animate(delay: 150.ms).fadeIn(),
                        ],
                      ),
                    ),
                    // Logout
                    GestureDetector(
                      onTap: () async {
                        await ref.read(authStateProvider.notifier).logout();
                        if (context.mounted) context.go(AppRoutes.login);
                      },
                      child: Container(
                        width: 44,
                        height: 44,
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
              const SizedBox(height: 28),
              // Children grid
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
                  child: childrenAsync.when(
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                    error: (e, _) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('😕', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          Text('Could not load children', style: Theme.of(context).textTheme.bodyLarge),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => ref.refresh(childrenProvider),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                    data: (children) => _ChildrenContent(children: children),
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

class _ChildrenContent extends ConsumerWidget {
  final List<Child> children;
  const _ChildrenContent({required this.children});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (children.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('👶', style: TextStyle(fontSize: 72))
                .animate().scale(curve: Curves.elasticOut, duration: 600.ms),
            const SizedBox(height: 20),
            const Text(
              'No children yet',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Add your first child profile to start speech therapy sessions',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
            ),
            const SizedBox(height: 28),
            GradientButton(
              label: '+ Add Child',
              gradient: const LinearGradient(colors: AppColors.warmGradient),
              onTap: () => _showAddChild(context, ref),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
      children: [
        const Text(
          'Your Children',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 16),
        ...children.asMap().entries.map((entry) {
          final i = entry.key;
          final child = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: _ChildCard(child: child, index: i),
          );
        }),
        const SizedBox(height: 8),
        GradientButton(
          label: '+ Add Another Child',
          gradient: const LinearGradient(colors: AppColors.warmGradient),
          height: 52,
          onTap: () => _showAddChild(context, ref),
        ),
      ],
    );
  }

  void _showAddChild(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddChildSheet(onAdded: () => ref.refresh(childrenProvider)),
    );
  }
}

class _ChildCard extends StatelessWidget {
  final Child child;
  final int index;
  const _ChildCard({required this.child, required this.index});

  @override
  Widget build(BuildContext context) {
    final grad = AppColors.lessonGradients[index % AppColors.lessonGradients.length];
    return GestureDetector(
      onTap: () => context.push('/children/${child.id}'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: grad),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: grad.first.withOpacity(0.35),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  child.initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    child.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (child.age != null)
                    Text(
                      '${child.age} years old',
                      style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
                    ),
                ],
              ),
            ),
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.25),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 18),
            ),
          ],
        ),
      )
          .animate(delay: Duration(milliseconds: 100 * index))
          .fadeIn(duration: 400.ms)
          .slideX(begin: 0.1, end: 0),
    );
  }
}
