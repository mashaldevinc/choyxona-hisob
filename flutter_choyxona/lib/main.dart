import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'theme/app_theme.dart';
import 'screens/setup_screen.dart';
import 'screens/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: const ChoyxonaApp(),
    ),
  );
}

class ChoyxonaApp extends StatefulWidget {
  const ChoyxonaApp({super.key});

  @override
  State<ChoyxonaApp> createState() => _ChoyxonaAppState();
}

class _ChoyxonaAppState extends State<ChoyxonaApp> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await context.read<AppProvider>().init();
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    return MaterialApp(
      title: 'Choyxona Hisob',
      debugShowCheckedModeBanner: false,
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      themeMode: provider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: _loading
          ? const _SplashScreen()
          : (provider.isSetupDone ? const MainScreen() : const SetupScreen()),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgLight,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: kPrimary,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(Icons.coffee, color: Colors.white, size: 50),
            ),
            const SizedBox(height: 20),
            const Text(
              'Choyxona Hisob',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: kPrimary,
              ),
            ),
            const SizedBox(height: 32),
            const CircularProgressIndicator(color: kPrimary),
          ],
        ),
      ),
    );
  }
}
