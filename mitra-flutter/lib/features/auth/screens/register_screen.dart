import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_theme.dart';
import '../../../core/router.dart';
import '../providers/auth_provider.dart';
import '../../../shared/widgets/gradient_button.dart';
import '../../../shared/widgets/mitra_text_field.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _licenseCtrl = TextEditingController();
  String _role = 'parent';
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _phoneCtrl.dispose();
    _licenseCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authStateProvider.notifier).register(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
        fullName: _nameCtrl.text.trim(),
        role: _role,
        phone: _phoneCtrl.text.isNotEmpty ? _phoneCtrl.text.trim() : null,
        licenseNumber: _licenseCtrl.text.isNotEmpty ? _licenseCtrl.text.trim() : null,
      );
      if (!mounted) return;
      final user = ref.read(currentUserProvider);
      if (user != null) {
        if (user.role == 'therapist') {
          context.go(AppRoutes.therapistDashboard);
        } else {
          context.go(AppRoutes.children);
        }
      }
    } catch (e) {
      setState(() => _error = 'Registration failed. Email may already be in use.');
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 32),
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.go(AppRoutes.login),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        'Create Account',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ).animate().fadeIn(duration: 400.ms),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.only(left: 60),
                  child: Text(
                    'Join Mitra to support your child\'s journey',
                    style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 14),
                  ),
                ).animate(delay: 150.ms).fadeIn(),
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Role selector
                        const Text(
                          'I am a...',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _roleChip('parent', '👪 Parent'),
                            const SizedBox(width: 10),
                            _roleChip('therapist', '👨‍⚕️ Therapist'),
                          ],
                        ),
                        const SizedBox(height: 20),
                        MitraTextField(
                          controller: _nameCtrl,
                          label: 'Full Name',
                          hint: 'Your name',
                          prefixIcon: Icons.person_outline,
                          textCapitalization: TextCapitalization.words,
                          validator: (v) => (v == null || v.isEmpty) ? 'Name is required' : null,
                        ),
                        const SizedBox(height: 14),
                        MitraTextField(
                          controller: _emailCtrl,
                          label: 'Email Address',
                          hint: 'you@example.com',
                          prefixIcon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Email is required';
                            if (!v.contains('@')) return 'Enter a valid email';
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        MitraTextField(
                          controller: _passCtrl,
                          label: 'Password',
                          hint: 'Minimum 8 characters',
                          prefixIcon: Icons.lock_outline,
                          obscureText: _obscure,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              color: AppColors.textMuted,
                            ),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Password is required';
                            if (v.length < 8) return 'Minimum 8 characters';
                            return null;
                          },
                        ),
                        if (_role == 'parent') ...[
                          const SizedBox(height: 14),
                          MitraTextField(
                            controller: _phoneCtrl,
                            label: 'Phone Number (optional)',
                            hint: '+91 XXXXXXXXXX',
                            prefixIcon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                          ),
                        ],
                        if (_role == 'therapist') ...[
                          const SizedBox(height: 14),
                          MitraTextField(
                            controller: _licenseCtrl,
                            label: 'License Number (optional)',
                            hint: 'RCI-XXXXX',
                            prefixIcon: Icons.badge_outlined,
                          ),
                        ],
                        if (_error != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, color: Colors.red, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        GradientButton(
                          label: _loading ? 'Creating Account...' : 'Create Account',
                          gradient: const LinearGradient(colors: AppColors.calmGradient),
                          onTap: _loading ? null : _submit,
                          isLoading: _loading,
                        ),
                      ],
                    ),
                  ),
                ).animate(delay: 300.ms).fadeIn().slideY(begin: 0.1),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 15),
                    ),
                    GestureDetector(
                      onTap: () => context.go(AppRoutes.login),
                      child: const Text(
                        'Sign In',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _roleChip(String value, String label) {
    final selected = _role == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _role = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : AppColors.surfaceBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.textMuted.withOpacity(0.2),
              width: selected ? 2 : 1,
            ),
            boxShadow: selected
                ? [BoxShadow(color: AppColors.primary.withOpacity(0.25), blurRadius: 10, offset: const Offset(0, 4))]
                : [],
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
