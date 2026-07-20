import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:just_audio/just_audio.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import '../../../theme/app_theme.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';
import '../../../shared/widgets/gradient_button.dart';

enum _Phase { ready, recording, uploading, scored, complete }

class SessionScreen extends ConsumerStatefulWidget {
  final String programId;
  final String childId;
  const SessionScreen({super.key, required this.programId, required this.childId});

  @override
  ConsumerState<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends ConsumerState<SessionScreen> with TickerProviderStateMixin {
  TherapySession? _session;
  int _currentIdx = 0;
  _Phase _phase = _Phase.ready;
  AttemptResult? _lastAttempt;
  List<double> _scores = [];
  bool _loading = true;
  String? _error;

  final _recorder = AudioRecorder();
  final _player = AudioPlayer();
  String? _recordingPath;
  Timer? _pollTimer;
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))
      ..repeat(reverse: true);
    _initSession();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _recorder.dispose();
    _player.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _initSession() async {
    try {
      final session = await ref.read(apiServiceProvider).createSession(
        widget.childId,
        widget.programId,
      );
      setState(() { _session = session; _loading = false; });
    } catch (e) {
      setState(() { _error = 'Failed to start session'; _loading = false; });
    }
  }

  ModuleItem? get _currentItem => _session?.items[_currentIdx];

  Future<void> _playTts() async {
    if (_currentItem == null) return;
    try {
      final url = ref.read(apiServiceProvider).getTtsUrl(_currentItem!.tamilWord);
      await _player.setUrl(url);
      await _player.play();
    } catch (_) {}
  }

  Future<void> _startRecording() async {
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Microphone permission required')),
      );
      return;
    }
    final dir = await getTemporaryDirectory();
    _recordingPath = p.join(dir.path, 'mitra_rec_${DateTime.now().millisecondsSinceEpoch}.m4a');
    await _recorder.start(const RecordConfig(encoder: AudioEncoder.aacLc), path: _recordingPath!);
    setState(() => _phase = _Phase.recording);
  }

  Future<void> _stopRecording() async {
    await _recorder.stop();
    if (_recordingPath == null || _session == null || _currentItem == null) return;
    setState(() => _phase = _Phase.uploading);
    try {
      final result = await ref.read(apiServiceProvider).submitAttempt(
        _session!.id,
        _currentItem!.id,
        _recordingPath!,
      );
      setState(() => _lastAttempt = result);
      _startPolling(result.attemptId);
    } catch (_) {
      setState(() { _phase = _Phase.ready; });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upload failed. Try again.')),
      );
    }
  }

  void _startPolling(String attemptId) {
    int tries = 0;
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      tries++;
      try {
        final result = await ref.read(apiServiceProvider).getAttemptStatus(
          _session!.id,
          attemptId,
        );
        if (result.status == 'done') {
          timer.cancel();
          setState(() {
            _lastAttempt = result;
            _scores.add(result.score ?? 0);
            _phase = _Phase.scored;
          });
        } else if (result.status == 'failed' || tries > 30) {
          timer.cancel();
          setState(() {
            _lastAttempt = AttemptResult(
              attemptId: attemptId, status: 'done', score: 0, mitraResponseType: 'gentle_correct',
            );
            _scores.add(0);
            _phase = _Phase.scored;
          });
        }
      } catch (_) {
        if (tries > 30) timer.cancel();
      }
    });
  }

  Future<void> _handleNext() async {
    if (_session == null) return;
    final next = _currentIdx + 1;
    if (next >= _session!.items.length) {
      await ref.read(apiServiceProvider).completeSession(_session!.id);
      setState(() => _phase = _Phase.complete);
    } else {
      setState(() {
        _currentIdx = next;
        _lastAttempt = null;
        _phase = _Phase.ready;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: AppColors.warmGradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('🤖', style: TextStyle(fontSize: 64)).animate().scale(curve: Curves.elasticOut, duration: 800.ms),
                SizedBox(height: 20),
                CircularProgressIndicator(color: Colors.white),
                SizedBox(height: 16),
                Text('Starting session...', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('😕', style: TextStyle(fontSize: 64)),
              const SizedBox(height: 16),
              Text(_error!, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 20),
              ElevatedButton(onPressed: () => context.pop(), child: const Text('Go Back')),
            ],
          ),
        ),
      );
    }

    if (_phase == _Phase.complete) return _buildCompleteScreen();

    final item = _currentItem;
    if (item == null) return const Scaffold(body: Center(child: Text('No items')));

    final total = _session!.items.length;
    final progress = _currentIdx / total;
    final gradColors = AppColors.lessonGradients[_currentIdx % AppColors.lessonGradients.length];

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () async {
                        if (_session != null) {
                          await ref.read(apiServiceProvider).abandonSession(_session!.id);
                        }
                        if (context.mounted) context.pop();
                      },
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.close, color: Colors.white, size: 20),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: progress,
                              backgroundColor: Colors.white.withOpacity(0.3),
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                              minHeight: 8,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_currentIdx + 1} / $total',
                            style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _session?.moduleName ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Companion bot
              _buildCompanion(),
              const SizedBox(height: 20),
              // Tamil word card
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 32),
                padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      item.tamilWord,
                      style: TextStyle(
                        fontSize: 56,
                        fontWeight: FontWeight.w900,
                        color: gradColors.first,
                        fontFamily: 'NotoSansTamil',
                        height: 1.2,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.transliteration,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.englishTranslation,
                      style: const TextStyle(fontSize: 16, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 350.ms).scale(begin: const Offset(0.9, 0.9)),
              const SizedBox(height: 24),
              // Action zone
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _buildActionZone(gradColors),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompanion() {
    String emoji;
    String message;
    if (_phase == _Phase.recording) {
      emoji = '👂';
      message = 'Listening...';
    } else if (_phase == _Phase.uploading) {
      emoji = '⏳';
      message = 'Scoring...';
    } else if (_phase == _Phase.scored) {
      if (_lastAttempt?.isExcellent == true) {
        emoji = '😄';
        message = 'Excellent!';
      } else if (_lastAttempt?.isGood == true) {
        emoji = '😊';
        message = 'Good try!';
      } else {
        emoji = '🤔';
        message = 'Try again!';
      }
    } else {
      emoji = '🤖';
      message = 'Tap mic to speak';
    }

    return AnimatedBuilder(
      animation: _pulseCtrl,
      builder: (ctx, _) {
        final scale = _phase == _Phase.recording
            ? 1.0 + _pulseCtrl.value * 0.12
            : 1.0;
        return Transform.scale(
          scale: scale,
          child: Container(
            width: 110,
            height: 110,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.25),
              shape: BoxShape.circle,
              border: _phase == _Phase.recording
                  ? Border.all(color: Colors.white, width: 3)
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 44)),
                Text(
                  message,
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildActionZone(List<Color> gradColors) {
    switch (_phase) {
      case _Phase.ready:
        return Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Hear button
                _ActionCircle(
                  emoji: '🔊',
                  label: 'Hear it',
                  onTap: _playTts,
                ),
                const SizedBox(width: 28),
                // Mic button
                GestureDetector(
                  onTap: _startRecording,
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: Colors.white.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 6)),
                      ],
                    ),
                    child: Center(
                      child: Icon(Icons.mic_rounded, color: gradColors.first, size: 42),
                    ),
                  ),
                ),
                const SizedBox(width: 28),
                const SizedBox(width: 64, height: 64),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Tap 🎙 and say the word!',
              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ],
        );

      case _Phase.recording:
        return Column(
          children: [
            GestureDetector(
              onTap: _stopRecording,
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: Colors.red.shade400,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 6)),
                  ],
                ),
                child: const Center(
                  child: Icon(Icons.stop_rounded, color: Colors.white, size: 44),
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
              .scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 700.ms),
            const SizedBox(height: 12),
            Text(
              'Recording... Tap ⏹ to stop',
              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ],
        );

      case _Phase.uploading:
        return Column(
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 12),
            Text(
              'Scoring your speech with AI...',
              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 15),
            ),
          ],
        );

      case _Phase.scored:
        if (_lastAttempt == null) return const SizedBox.shrink();
        return _buildScoreCard();

      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildScoreCard() {
    final score = _lastAttempt?.score ?? 0;
    final transcript = _lastAttempt?.transcript;
    final isExcellent = score >= 80;
    final isGood = score >= 50;

    List<Color> scoreGrad;
    String emoji;
    String msg;
    if (isExcellent) {
      scoreGrad = AppColors.scoreGoodGradient;
      emoji = '🌟';
      msg = 'Excellent pronunciation!';
    } else if (isGood) {
      scoreGrad = AppColors.scoreMidGradient;
      emoji = '👍';
      msg = 'Good try! Keep going!';
    } else {
      scoreGrad = AppColors.scoreLowGradient;
      emoji = '💪';
      msg = 'Try again — you\'re improving!';
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Score circle
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: scoreGrad),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${score.toInt()}',
                    style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(emoji, style: const TextStyle(fontSize: 28)),
                    Text(msg, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                    if (transcript != null && transcript.isNotEmpty)
                      Text(
                        'Heard: "$transcript"',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GradientButton(
            label: _currentIdx + 1 >= (_session?.items.length ?? 1) ? '🎉 Finish' : 'Next Word →',
            gradient: LinearGradient(colors: scoreGrad),
            height: 50,
            onTap: _handleNext,
          ),
          if (!isExcellent) ...[
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => setState(() { _lastAttempt = null; _phase = _Phase.ready; }),
              child: Text(
                'Try again',
                style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.92, 0.92));
  }

  Widget _buildCompleteScreen() {
    final avg = _scores.isEmpty ? 0 : (_scores.reduce((a, b) => a + b) / _scores.length).round();
    final isGreat = avg >= 70;
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
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🎉', style: TextStyle(fontSize: 80))
                  .animate()
                  .scale(curve: Curves.elasticOut, duration: 800.ms)
                  .then()
                  .shake(hz: 2, rotation: 0.04),
              const SizedBox(height: 24),
              const Text(
                'Session Complete!',
                style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                textAlign: TextAlign.center,
              ).animate(delay: 300.ms).fadeIn().slideY(begin: 0.2),
              const SizedBox(height: 12),
              Text(
                isGreat ? 'Amazing work today! 🌟' : 'Great effort! Keep practicing 💪',
                style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 18),
                textAlign: TextAlign.center,
              ).animate(delay: 450.ms).fadeIn(),
              const SizedBox(height: 32),
              // Score ring
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '$avg%',
                      style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900),
                    ),
                    Text(
                      'avg score',
                      style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
                    ),
                  ],
                ),
              ).animate(delay: 600.ms).scale(curve: Curves.elasticOut, begin: const Offset(0.5, 0.5)),
              const SizedBox(height: 16),
              Text(
                '${_scores.length} words practiced',
                style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 16),
              ).animate(delay: 800.ms).fadeIn(),
              const SizedBox(height: 48),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: GradientButton(
                  label: 'Done 🏠',
                  gradient: LinearGradient(colors: [Colors.white, Colors.white.withOpacity(0.8)]),
                  onTap: () => context.go('/children'),
                  height: 56,
                ),
              ).animate(delay: 900.ms).fadeIn().slideY(begin: 0.2),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionCircle extends StatelessWidget {
  final String emoji;
  final String label;
  final VoidCallback? onTap;
  const _ActionCircle({required this.emoji, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.25),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 30))),
          ),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
