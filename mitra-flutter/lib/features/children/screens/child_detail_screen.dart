import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';
import '../../../shared/widgets/gradient_button.dart';

final childProgramsProvider = FutureProvider.family<List<AssignedProgram>, String>((ref, childId) {
  return ref.watch(apiServiceProvider).getChildPrograms(childId);
});

class ChildDetailScreen extends ConsumerWidget {
  final String childId;
  const ChildDetailScreen({super.key, required this.childId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final programsAsync = ref.watch(childProgramsProvider(childId));

    return Scaffold(
      body: programsAsync.when(
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
        ),
        error: (e, _) => Scaffold(
          appBar: AppBar(
            backgroundColor: AppColors.primary,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
              onPressed: () => context.pop(),
            ),
          ),
          body: Center(child: Text('Error: $e')),
        ),
        data: (programs) => _ChildDetailBody(childId: childId, programs: programs),
      ),
    );
  }
}

class _ChildDetailBody extends ConsumerWidget {
  final String childId;
  final List<AssignedProgram> programs;
  const _ChildDetailBody({required this.childId, required this.programs});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient AppBar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            leading: IconButton(
              icon: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
              ),
              onPressed: () => context.pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: AppColors.warmGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text('🧒', style: TextStyle(fontSize: 46)),
                        ),
                      ).animate().scale(curve: Curves.elasticOut, duration: 600.ms),
                      const SizedBox(height: 12),
                      const Text(
                        'Child Profile',
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Body
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Progress shortcut
                GestureDetector(
                  onTap: () => context.push('/progress/$childId'),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: AppColors.greenGradient),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.green.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.show_chart, color: Colors.white),
                        ),
                        const SizedBox(width: 16),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('View Progress', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17)),
                              Text('Charts, scores & streaks', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 18),
                      ],
                    ),
                  ),
                ).animate(duration: 400.ms).fadeIn().slideY(begin: 0.1),
                const SizedBox(height: 24),
                // Programs section
                const Text(
                  'Assigned Programs',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 6),
                Text(
                  programs.isEmpty
                      ? 'No programs assigned yet. Ask your therapist.'
                      : '${programs.length} program${programs.length != 1 ? 's' : ''} assigned',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 16),
                if (programs.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Column(
                      children: [
                        Text('📋', style: TextStyle(fontSize: 48)),
                        SizedBox(height: 12),
                        Text(
                          'No programs yet',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: AppColors.textPrimary),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Your therapist will assign speech practice programs here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                      ],
                    ),
                  )
                else
                  ...programs.asMap().entries.map((entry) {
                    final i = entry.key;
                    final p = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _ProgramCard(program: p, index: i, childId: childId),
                    );
                  }),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  final AssignedProgram program;
  final int index;
  final String childId;
  const _ProgramCard({required this.program, required this.index, required this.childId});

  @override
  Widget build(BuildContext context) {
    final grad = AppColors.lessonGradients[index % AppColors.lessonGradients.length];
    final canStart = program.isActive;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top gradient strip
          Container(
            height: 6,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: grad),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: grad),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Center(
                        child: Text('🗣️', style: TextStyle(fontSize: 26)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            program.moduleTitle,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          _StatusBadge(isActive: program.isActive),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                GradientButton(
                  label: program.statusLabel,
                  gradient: canStart
                      ? LinearGradient(colors: grad)
                      : const LinearGradient(colors: [Color(0xFFCCCCCC), Color(0xFFBBBBBB)]),
                  height: 48,
                  onTap: canStart
                      ? () => context.push('/session/${program.id}?childId=$childId')
                      : null,
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate(delay: Duration(milliseconds: 120 * index))
        .fadeIn(duration: 400.ms)
        .slideY(begin: 0.1);
  }
}

class _StatusBadge extends StatelessWidget {
  // The backend only exposes a boolean (is_active — not_started/in_progress
  // collapsed together), not the underlying 3-way status enum, so that's all
  // this can honestly render.
  final bool isActive;
  const _StatusBadge({required this.isActive});

  @override
  Widget build(BuildContext context) {
    final bg = isActive ? AppColors.primaryLight.withOpacity(0.2) : AppColors.greenLight;
    final text = isActive ? AppColors.primaryDark : AppColors.green;
    final label = isActive ? '● Active' : '✓ Completed';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: text, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }
}
