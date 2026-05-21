import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'guests_screen.dart';
import 'debts_screen.dart';
import 'receipts_screen.dart';

class MainScreen extends StatefulWidget {
  final int initialTab;
  const MainScreen({super.key, this.initialTab = 0});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late int _current;

  @override
  void initState() {
    super.initState();
    _current = widget.initialTab;
  }

  static const _tabs = [
    _TabItem(icon: Icons.coffee, label: 'Choyxona'),
    _TabItem(icon: Icons.people, label: 'Mehmonlar'),
    _TabItem(icon: Icons.book, label: 'Qarz Daftar'),
    _TabItem(icon: Icons.receipt_long, label: 'Cheklar'),
  ];

  static const _screens = [
    DashboardScreen(),
    GuestsScreen(),
    DebtsScreen(),
    ReceiptsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _current, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _current,
        onTap: (i) => setState(() => _current = i),
        items: _tabs
            .map((t) => BottomNavigationBarItem(
                  icon: Icon(t.icon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final String label;
  const _TabItem({required this.icon, required this.label});
}
