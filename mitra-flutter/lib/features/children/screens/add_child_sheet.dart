import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../theme/app_theme.dart';
import '../../../data/services/api_service.dart';
import '../../../shared/widgets/gradient_button.dart';
import '../../../shared/widgets/mitra_text_field.dart';

class AddChildSheet extends ConsumerStatefulWidget {
  final VoidCallback onAdded;
  const AddChildSheet({super.key, required this.onAdded});

  @override
  ConsumerState<AddChildSheet> createState() => _AddChildSheetState();
}

class _AddChildSheetState extends ConsumerState<AddChildSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _gender = 'unspecified';
  String _avatarColor = '#FF6B35';
  bool _loading = false;

  static const _colors = [
    '#FF6B35', '#7C3AED', '#00B4D8', '#10B981', '#FBBF24', '#EC4899'
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).createChild(
        name: _nameCtrl.text.trim(),
        age: int.parse(_ageCtrl.text.trim()),
        gender: _gender,
        avatarColor: _avatarColor,
        diagnosisNotes: _notesCtrl.text.isNotEmpty ? _notesCtrl.text.trim() : null,
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onAdded();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add child. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.textMuted.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text(
                'Add Child Profile',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 4),
              const Text(
                'Create a profile to start sessions',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 24),
              MitraTextField(
                controller: _nameCtrl,
                label: "Child's Name",
                hint: "e.g. Ravi",
                prefixIcon: Icons.child_care,
                textCapitalization: TextCapitalization.words,
                validator: (v) => (v == null || v.isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 14),
              MitraTextField(
                controller: _ageCtrl,
                label: 'Age',
                hint: 'e.g. 5',
                prefixIcon: Icons.cake_outlined,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Age is required';
                  final age = int.tryParse(v);
                  if (age == null || age < 1 || age > 18) return 'Enter a valid age (1-18)';
                  return null;
                },
              ),
              const SizedBox(height: 14),
              // Gender selector
              const Text('Gender', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _genderChip('boy', '👦 Boy'),
                  const SizedBox(width: 8),
                  _genderChip('girl', '👧 Girl'),
                  const SizedBox(width: 8),
                  _genderChip('unspecified', '🧒 Other'),
                ],
              ),
              const SizedBox(height: 14),
              // Avatar color
              const Text('Avatar Color', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              const SizedBox(height: 10),
              Row(
                children: _colors.map((hex) {
                  final color = Color(int.parse(hex.replaceFirst('#', 'FF'), radix: 16));
                  final selected = _avatarColor == hex;
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: GestureDetector(
                      onTap: () => setState(() => _avatarColor = hex),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: selected ? AppColors.textPrimary : Colors.transparent,
                            width: 3,
                          ),
                          boxShadow: selected
                              ? [BoxShadow(color: color.withOpacity(0.5), blurRadius: 8, offset: const Offset(0, 3))]
                              : [],
                        ),
                        child: selected
                            ? const Icon(Icons.check, color: Colors.white, size: 18)
                            : null,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              MitraTextField(
                controller: _notesCtrl,
                label: 'Notes (optional)',
                hint: 'Any diagnosis or special needs...',
                prefixIcon: Icons.note_outlined,
                maxLines: 2,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 24),
              GradientButton(
                label: _loading ? 'Adding...' : 'Add Child',
                gradient: const LinearGradient(colors: AppColors.warmGradient),
                onTap: _loading ? null : _submit,
                isLoading: _loading,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _genderChip(String value, String label) {
    final selected = _gender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _gender = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : AppColors.surfaceBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.textMuted.withOpacity(0.2),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
