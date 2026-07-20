import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../../../data/models/models.dart';
import '../../../data/services/api_service.dart';
import '../../../shared/widgets/gradient_button.dart';
import '../../../shared/widgets/mitra_text_field.dart';

class ContentBuilderScreen extends ConsumerStatefulWidget {
  const ContentBuilderScreen({super.key});

  @override
  ConsumerState<ContentBuilderScreen> createState() => _ContentBuilderScreenState();
}

class _ContentBuilderScreenState extends ConsumerState<ContentBuilderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _difficulty = 'beginner';
  bool _loading = false;
  TherapyModule? _createdModule;
  final List<_ItemDraft> _items = [];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    for (final item in _items) item.dispose();
    super.dispose();
  }

  Future<void> _createModule() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final module = await ref.read(apiServiceProvider).createModule(
        name: _titleCtrl.text.trim(),
        description: _descCtrl.text.isNotEmpty ? _descCtrl.text.trim() : null,
        difficultyLevel: _difficulty,
      );
      setState(() { _createdModule = module; _items.add(_ItemDraft()); });
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to create module.')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addItem(_ItemDraft draft) async {
    if (!draft.formKey.currentState!.validate()) return;
    if (_createdModule == null) return;
    setState(() => draft.saving = true);
    try {
      await ref.read(apiServiceProvider).addModuleItem(
        _createdModule!.id,
        tamilWord: draft.tamilCtrl.text.trim(),
        transliteration: draft.romanCtrl.text.trim(),
        englishTranslation: draft.englishCtrl.text.trim(),
        orderIndex: _items.indexOf(draft),
      );
      draft.saved = true;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Word added ✓')),
        );
        setState(() => _items.add(_ItemDraft()));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to add word.')),
      );
    } finally {
      if (mounted) setState(() => draft.saving = false);
    }
  }

  Future<void> _publishModule() async {
    if (_createdModule == null) return;
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).publishModule(_createdModule!.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Module published! 🎉')),
        );
        context.pop();
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to publish.')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: AppColors.calmGradient,
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
                          Text('Content Builder', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                          Text('Create a therapy module', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ),
                    const Text('📝', style: TextStyle(fontSize: 30)),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),
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
                    padding: const EdgeInsets.fromLTRB(20, 28, 20, 40),
                    children: [
                      // Step 1: Module info
                      _StepCard(
                        step: 1,
                        title: 'Module Details',
                        done: _createdModule != null,
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              MitraTextField(
                                controller: _titleCtrl,
                                label: 'Module Title',
                                hint: 'e.g. Basic Tamil Vowels',
                                prefixIcon: Icons.title,
                                enabled: _createdModule == null,
                                textCapitalization: TextCapitalization.sentences,
                                validator: (v) => (v == null || v.isEmpty) ? 'Title required' : null,
                              ),
                              const SizedBox(height: 12),
                              MitraTextField(
                                controller: _descCtrl,
                                label: 'Description (optional)',
                                hint: 'Describe the module...',
                                prefixIcon: Icons.description_outlined,
                                maxLines: 2,
                                enabled: _createdModule == null,
                                textCapitalization: TextCapitalization.sentences,
                              ),
                              const SizedBox(height: 12),
                              // Difficulty
                              const Align(
                                alignment: Alignment.centerLeft,
                                child: Text('Difficulty', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: ['beginner', 'intermediate', 'advanced'].map((d) {
                                  final sel = _difficulty == d;
                                  final color = d == 'beginner' ? AppColors.green : d == 'intermediate' ? AppColors.sunny : AppColors.primary;
                                  return Expanded(
                                    child: GestureDetector(
                                      onTap: _createdModule == null ? () => setState(() => _difficulty = d) : null,
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 180),
                                        margin: const EdgeInsets.only(right: 8),
                                        padding: const EdgeInsets.symmetric(vertical: 10),
                                        decoration: BoxDecoration(
                                          color: sel ? color : AppColors.surfaceBg,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: sel ? color : AppColors.textMuted.withOpacity(0.2)),
                                        ),
                                        child: Text(
                                          d[0].toUpperCase() + d.substring(1),
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: sel ? Colors.white : AppColors.textSecondary,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                              if (_createdModule == null) ...[
                                const SizedBox(height: 20),
                                GradientButton(
                                  label: _loading ? 'Creating...' : 'Create Module',
                                  gradient: const LinearGradient(colors: AppColors.calmGradient),
                                  onTap: _loading ? null : _createModule,
                                  isLoading: _loading,
                                ),
                              ],
                            ],
                          ),
                        ),
                      ).animate().fadeIn(duration: 400.ms),
                      if (_createdModule != null) ...[
                        const SizedBox(height: 20),
                        // Step 2: Add words
                        _StepCard(
                          step: 2,
                          title: 'Add Tamil Words',
                          done: false,
                          child: Column(
                            children: [
                              ..._items.asMap().entries.map((entry) {
                                final i = entry.key;
                                final draft = entry.value;
                                if (draft.saved) return const SizedBox.shrink();
                                return _WordItemForm(
                                  draft: draft,
                                  index: i,
                                  onAdd: () => _addItem(draft),
                                );
                              }),
                              const SizedBox(height: 12),
                              const Divider(),
                              const SizedBox(height: 12),
                              Text(
                                '${_items.where((d) => d.saved).length} words added',
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              ),
                            ],
                          ),
                        ).animate(delay: 200.ms).fadeIn(),
                        const SizedBox(height: 20),
                        // Step 3: Publish
                        GradientButton(
                          label: _loading ? 'Publishing...' : '🚀 Publish Module',
                          gradient: const LinearGradient(colors: AppColors.warmGradient),
                          onTap: _loading ? null : _publishModule,
                          isLoading: _loading,
                        ).animate(delay: 300.ms).fadeIn(),
                      ],
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

class _ItemDraft {
  final formKey = GlobalKey<FormState>();
  final tamilCtrl = TextEditingController();
  final romanCtrl = TextEditingController();
  final englishCtrl = TextEditingController();
  bool saving = false;
  bool saved = false;

  void dispose() {
    tamilCtrl.dispose();
    romanCtrl.dispose();
    englishCtrl.dispose();
  }
}

class _WordItemForm extends ConsumerStatefulWidget {
  final _ItemDraft draft;
  final int index;
  final VoidCallback onAdd;
  const _WordItemForm({required this.draft, required this.index, required this.onAdd});

  @override
  ConsumerState<_WordItemForm> createState() => _WordItemFormState();
}

class _WordItemFormState extends ConsumerState<_WordItemForm> {
  @override
  Widget build(BuildContext context) {
    return Form(
      key: widget.draft.formKey,
      child: Container(
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.primaryLight.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(gradient: const LinearGradient(colors: AppColors.calmGradient), shape: BoxShape.circle),
                  child: Center(child: Text('${widget.index + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13))),
                ),
                const SizedBox(width: 10),
                const Text('New Word', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary)),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: widget.draft.tamilCtrl,
              style: const TextStyle(fontSize: 24, fontFamily: 'NotoSansTamil', fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                hintText: 'Tamil word (e.g. அம்மா)',
                hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.6), fontSize: 18),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Tamil word required' : null,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: widget.draft.romanCtrl,
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Transliteration (amma)',
                      filled: true, fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: widget.draft.englishCtrl,
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'English (Mother)',
                      filled: true, fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            GradientButton(
              label: widget.draft.saving ? 'Saving...' : '+ Add Word',
              gradient: const LinearGradient(colors: AppColors.greenGradient),
              height: 44,
              onTap: widget.draft.saving ? null : widget.onAdd,
              isLoading: widget.draft.saving,
            ),
          ],
        ),
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  final int step;
  final String title;
  final bool done;
  final Widget child;
  const _StepCard({required this.step, required this.title, required this.done, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 14, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            decoration: BoxDecoration(
              gradient: done
                  ? const LinearGradient(colors: AppColors.greenGradient)
                  : const LinearGradient(colors: AppColors.calmGradient),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.25), shape: BoxShape.circle),
                  child: Center(
                    child: done
                        ? const Icon(Icons.check, color: Colors.white, size: 18)
                        : Text('$step', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                  ),
                ),
                const SizedBox(width: 12),
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
              ],
            ),
          ),
          Padding(padding: const EdgeInsets.all(20), child: child),
        ],
      ),
    );
  }
}
