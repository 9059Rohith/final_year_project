import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';

final progressSummaryProvider = FutureProvider.family<ProgressBundle, String>((ref, childId) {
  return ref.watch(apiServiceProvider).getFullProgress(childId);
});

class ProgressScreen extends ConsumerWidget {
  final String childId;
  const ProgressScreen({super.key, required this.childId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(progressSummaryProvider(childId));

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: AppColors.greenGradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Progress',
                            style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                          ),
                          Text(
                            'Track growth over time',
                            style: TextStyle(color: Colors.white70, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                    const Text('📊', style: TextStyle(fontSize: 32)),
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
                  child: summaryAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    error: (e, _) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('😕', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          const Text('Could not load progress'),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => ref.refresh(progressSummaryProvider(childId)),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                    data: (bundle) => _ProgressBody(bundle: bundle),
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

class _ProgressBody extends StatelessWidget {
  final ProgressBundle bundle;
  const _ProgressBody({required this.bundle});

  @override
  Widget build(BuildContext context) {
    final summary = bundle.summary;
    final overallMastery = summary.overallAverageScore ?? 0;
    final avgScore = summary.overallAttemptAverage ?? 0;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
      children: [
        // Stats row
        Row(
          children: [
            _StatCard(value: '${overallMastery.toInt()}%', label: 'Mastery', color: AppColors.green, emoji: '🎯'),
            const SizedBox(width: 12),
            _StatCard(value: '${summary.totalSessions}', label: 'Sessions', color: AppColors.teal, emoji: '🗓️'),
            const SizedBox(width: 12),
            _StatCard(value: '${bundle.streak.currentStreak}🔥', label: 'Streak', color: AppColors.sunny, emoji: ''),
          ],
        ).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 20),
        // Average score
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 4))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Average Score', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: AppColors.warmGradient),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '${avgScore.toInt()}',
                        style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${summary.totalAttempts} total attempts',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: avgScore / 100,
                            backgroundColor: AppColors.surfaceBg,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              avgScore >= 80 ? AppColors.green : avgScore >= 50 ? AppColors.sunny : Colors.red,
                            ),
                            minHeight: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate(delay: 150.ms).fadeIn().slideY(begin: 0.08),
        const SizedBox(height: 20),
        // Timeseries chart
        if (bundle.timeseries.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Score Over Time', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                const SizedBox(height: 20),
                SizedBox(
                  height: 180,
                  child: LineChart(
                    LineChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (_) => FlLine(color: AppColors.textMuted.withOpacity(0.1), strokeWidth: 1),
                      ),
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 32,
                            getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                          ),
                        ),
                        bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      minY: 0,
                      maxY: 100,
                      lineBarsData: [
                        LineChartBarData(
                          spots: bundle.timeseries.asMap().entries.map((e) {
                            return FlSpot(e.key.toDouble(), e.value.score);
                          }).toList(),
                          isCurved: true,
                          gradient: const LinearGradient(colors: AppColors.warmGradient),
                          barWidth: 3,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: LinearGradient(
                              colors: [AppColors.primary.withOpacity(0.2), AppColors.primary.withOpacity(0)],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ).animate(delay: 300.ms).fadeIn().slideY(begin: 0.08),
          const SizedBox(height: 20),
        ],
        // By module
        if (summary.moduleProgress.isNotEmpty) ...[
          const Text('By Module', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          ...summary.moduleProgress.asMap().entries.map((entry) {
            final i = entry.key;
            final m = entry.value;
            final grad = AppColors.lessonGradients[i % AppColors.lessonGradients.length];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 10, height: 10,
                          decoration: BoxDecoration(gradient: LinearGradient(colors: grad), shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(m.moduleName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary)),
                        ),
                        Text('${m.masteryScore.toInt()}%', style: TextStyle(fontWeight: FontWeight.w800, color: grad.first, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: m.masteryScore / 100,
                        backgroundColor: AppColors.surfaceBg,
                        valueColor: AlwaysStoppedAnimation<Color>(grad.first),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text('${m.sessionCount} sessions • ${m.itemsMastered} mastered', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ).animate(delay: Duration(milliseconds: 400 + 100 * i)).fadeIn().slideX(begin: 0.05),
            );
          }),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  final String emoji;
  const _StatCard({required this.value, required this.label, required this.color, required this.emoji});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 3))],
        ),
        child: Column(
          children: [
            if (emoji.isNotEmpty) Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
