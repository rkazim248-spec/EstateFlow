import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../clients/client_list_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../properties/property_list_screen.dart';
import '../settings/settings_screen.dart';

/// Bottom-navigation host for the signed-in experience.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.authService});

  final AuthService authService;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  void _select(int index) {
    if (_index == index) return;
    setState(() => _index = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          DashboardScreen(
            onOpenProperties: () => _select(1),
            onOpenClients: () => _select(2),
          ),
          const PropertyListScreen(),
          const ClientListScreen(),
          SettingsScreen(authService: widget.authService),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _select,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.home_work_outlined),
            selectedIcon: Icon(Icons.home_work),
            label: 'Properties',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Clients',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
